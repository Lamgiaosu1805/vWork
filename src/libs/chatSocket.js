import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import { io } from "socket.io-client";

import utils from "../helpers/utils";
import {
  upsertConversation,
  appendMessage,
  markMessagesSeen,
  deleteConversation,
  deleteMessage,
  clearActiveConversationId,
  updateMessage,
} from "../redux/slice/chatSlice";

let chatSocket = null;
let currentToken = null;
let globalDispatch = null;
let currentUserKeys = null;
let appStateSubscription = null;

const isFromSelf = (message) => {
  if (!currentUserKeys || !message) return false;
  const senderId =
    message?.senderId?._id ??
    message?.senderId?.id ??
    message?.senderId ??
    null;
  return (
    String(senderId) === String(currentUserKeys.id) ||
    String(senderId) === String(currentUserKeys.userInfoId)
  );
};

const attachGlobalHandlers = () => {
  if (!chatSocket || !globalDispatch) return;

  chatSocket.off("conversation:upserted");
  chatSocket.off("message:new");
  chatSocket.off("message:seen");
  chatSocket.off("conversation:deleted");
  chatSocket.off("message:deleted");
  chatSocket.off("message:recalled");

  chatSocket.on("conversation:upserted", (payload) => {
    const conversation = payload?.conversation ?? payload?.data ?? payload;
    if (conversation) globalDispatch(upsertConversation(conversation));
  });

  chatSocket.on("message:new", (payload) => {
    const message =
      payload?.message ??
      payload?.data?.message ??
      payload?.data ??
      payload ??
      null;
    const conversation =
      payload?.conversation ?? payload?.data?.conversation ?? null;
    const conversationId =
      conversation?._id ??
      message?.conversationId ??
      payload?.conversationId ??
      null;

    if (!conversationId) return;

    const clientMessageId =
      payload?.clientMessageId ??
      payload?.data?.clientMessageId ??
      message?.clientMessageId ??
      null;

    const normalized = message?.conversationId
      ? { ...(message || {}), ...(clientMessageId ? { clientMessageId } : {}) }
      : {
          ...message,
          conversationId,
          ...(clientMessageId ? { clientMessageId } : {}),
        };

    globalDispatch(appendMessage({ conversationId, message: normalized }));
    globalDispatch(
      upsertConversation(
        conversation ?? { _id: conversationId, lastMessage: normalized },
      ),
    );
  });

  chatSocket.on("message:seen", (payload) => {
    const conversation =
      payload?.conversation ?? payload?.data?.conversation ?? null;

    const conversationId =
      conversation?._id ?? null ?? payload?.conversationId ?? null;
    if (!conversationId) return;
    globalDispatch(
      markMessagesSeen({ conversationId, userInfoId: payload?.userInfoId }),
    );
  });

  chatSocket.on("conversation:deleted", (payload) => {
    const conversationId =
      payload?.conversationId ?? payload?.data?.conversationId ?? null;
    if (!conversationId || !globalDispatch) return;
    globalDispatch(deleteConversation(conversationId));
    globalDispatch(clearActiveConversationId());
  });

  chatSocket.on("message:deleted", (payload) => {
    const conversationId =
      payload?.conversationId ?? payload?.data?.conversationId ?? null;
    const messageId = payload?.messageId ?? payload?.data?.messageId ?? null;
    if (!conversationId || !messageId || !globalDispatch) return;
    globalDispatch(deleteMessage({ conversationId, messageId }));
  });

  chatSocket.on("message:recalled", (payload) => {
    const conversationId = payload?.conversationId;
    const message = payload?.message;

    if (!conversationId || !message) return;

    globalDispatch(appendMessage({ conversationId, message }));
  });
};

const attachDiagnosticHandlers = () => {
  if (!chatSocket) return;

  chatSocket.off("connect_error");
  chatSocket.off("disconnect");

  chatSocket.on("connect", () => {
    console.log("[chatSocket] connected");
  });

  chatSocket.on("disconnect", (reason) => {
    console.log("[chatSocket] disconnected:", reason);
    if (reason === "io server disconnect") {
      chatSocket.connect();
    }
  });

  chatSocket.on("connect_error", (err) => {
    console.log("[chatSocket] connect_error:", err.message);
  });

  chatSocket.io.on("reconnect_attempt", (attempt) => {
    console.log(`[chatSocket] reconnect_attempt #${attempt}`);
  });

  chatSocket.io.on("reconnect_failed", () => {
    console.log("[chatSocket] reconnect_failed — đã hết số lần thử");
  });
};

const attachAppStateListener = () => {
  if (appStateSubscription) return;

  appStateSubscription = AppState.addEventListener("change", (nextState) => {
    if (nextState === "active" && chatSocket && !chatSocket.connected) {
      console.log("[chatSocket] app foregrounded, forcing reconnect");
      chatSocket.connect();
    }
  });
};

const createChatSocket = (token) => {
  if (chatSocket) return chatSocket;

  chatSocket = io(utils.BASE_URL, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
    randomizationFactor: 0.5,
    timeout: 10000,
    auth: { token },
  });

  attachDiagnosticHandlers();
  attachAppStateListener();

  return chatSocket;
};

export const connectChatSocket = async (token) => {
  const resolvedToken =
    token || currentToken || (await AsyncStorage.getItem("accessToken"));

  if (!resolvedToken) {
    return null;
  }

  currentToken = resolvedToken;

  if (
    chatSocket &&
    chatSocket.connected &&
    chatSocket.auth?.token === resolvedToken
  ) {
    return chatSocket;
  }

  if (
    chatSocket &&
    chatSocket.auth?.token &&
    chatSocket.auth.token !== resolvedToken
  ) {
    chatSocket.removeAllListeners();
    chatSocket.io.removeAllListeners();
    chatSocket.disconnect();
    chatSocket = null;
  }

  const instance = createChatSocket(resolvedToken);
  instance.auth = { token: resolvedToken };

  if (!instance.connected) {
    instance.connect();
  }

  if (globalDispatch) attachGlobalHandlers();

  return instance;
};

export const getChatSocket = () => chatSocket;

export const isChatSocketConnected = () => Boolean(chatSocket?.connected);

export const disconnectChatSocket = () => {
  if (!chatSocket) return;

  chatSocket.removeAllListeners();
  chatSocket.io.removeAllListeners();
  chatSocket.disconnect();
  chatSocket = null;
  currentToken = null;

  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
};

export const setChatSocketToken = (token) => {
  currentToken = token;

  if (chatSocket) {
    chatSocket.auth = { token };
  }
};

export const registerGlobalChatHandlers = (dispatch) => {
  globalDispatch = dispatch;
  if (chatSocket) attachGlobalHandlers();
};

export const onChatSocketStatusChange = (callback) => {
  if (!chatSocket) return () => {};

  const handleConnect = () => callback("connected");
  const handleDisconnect = () => callback("disconnected");
  const handleReconnectAttempt = () => callback("connecting");
  const handleConnectError = () => callback("connecting");

  chatSocket.on("connect", handleConnect);
  chatSocket.on("disconnect", handleDisconnect);
  chatSocket.io.on("reconnect_attempt", handleReconnectAttempt);
  chatSocket.on("connect_error", handleConnectError);

  return () => {
    chatSocket?.off("connect", handleConnect);
    chatSocket?.off("disconnect", handleDisconnect);
    chatSocket?.io.off("reconnect_attempt", handleReconnectAttempt);
    chatSocket?.off("connect_error", handleConnectError);
  };
};

export default chatSocket;
