import AsyncStorage from "@react-native-async-storage/async-storage";
import { io } from "socket.io-client";

import utils from "../helpers/utils";
import {
  upsertConversation,
  appendMessage,
  markMessagesSeen,
} from "../redux/slice/chatSlice";

let chatSocket = null;
let currentToken = null;
let globalDispatch = null;
let currentUserKeys = null;

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

  // prevent double registration by removing first
  chatSocket.off("conversation:upserted");
  chatSocket.off("message:new");
  chatSocket.off("message:seen");

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
};

const createChatSocket = (token) => {
  if (chatSocket) return chatSocket;

  chatSocket = io(utils.BASE_URL, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    auth: { token },
  });

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
    chatSocket.disconnect();
    chatSocket = null;
  }

  const instance = createChatSocket(resolvedToken);
  instance.auth = { token: resolvedToken };

  if (!instance.connected) {
    instance.connect();
  }

  // attach global handlers if dispatch registered
  if (globalDispatch) attachGlobalHandlers();

  return instance;
};

export const getChatSocket = () => chatSocket;

export const isChatSocketConnected = () => Boolean(chatSocket?.connected);

export const disconnectChatSocket = () => {
  if (!chatSocket) return;

  chatSocket.removeAllListeners();
  chatSocket.disconnect();
  chatSocket = null;
  currentToken = null;
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

export default chatSocket;
