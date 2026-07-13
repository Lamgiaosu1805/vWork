import { useEffect, useRef, useState } from "react";
import {
  appendMessage,
  upsertConversation,
  updateMessageStatus,
} from "../../redux/slice/chatSlice";
import { getChatSocket } from "../../libs/chatSocket";
import { makeClientMessageId } from "../../utils/chatUtils";
import chatApi from "../../api/chat";

export default function useChatActions({
  conversationId,
  dispatch,
  user,
  scrollToBottom,
}) {
  const [sending, setSending] = useState(false);
  const retryQueueRef = useRef([]);

  const buildSenderId = () => {
    const senderId = user?.userInfo?._id ?? user?._id;
    if (!senderId) return null;

    return {
      _id: senderId,
      full_name: user?.userInfo?.full_name ?? user?.full_name,
      avatar: user?.userInfo?.avatar ?? user?.avatar,
      id_account: user?.userInfo?.id_account ?? user?.id_account,
      ma_nv: user?.userInfo?.ma_nv ?? user?.ma_nv,
    };
  };

  const buildMentionsSnapshot = (mentions) => {
    if (!Array.isArray(mentions) || mentions.length === 0) return [];
    return mentions.map((m) =>
      m.type === "all"
        ? { type: "all", userId: null }
        : {
            type: "user",
            userId: { _id: m.userId, full_name: m.full_name },
          },
    );
  };

  const buildMentionsPayload = (mentions) => {
    if (!Array.isArray(mentions) || mentions.length === 0) return [];
    return mentions.map((m) =>
      m.type === "all"
        ? { type: "all", full_name: m.full_name ?? "Mọi người" }
        : { type: "user", userId: m.userId, full_name: m.full_name },
    );
  };

  const buildReplySnapshot = (replyToMessage) => {
    if (!replyToMessage?._id) return null;
    return {
      _id: replyToMessage._id,
      content: replyToMessage.content ?? "",
      type: replyToMessage.type ?? "text",
      recalled: replyToMessage.recalled ?? null,
      senderId: replyToMessage.senderId ?? null,
    };
  };

  const emitTextMessage = (
    content,
    clientMessageId,
    replyToMessageId,
    mentionsPayload,
  ) =>
    new Promise((resolve, reject) => {
      const socket = getChatSocket();
      if (!socket?.connected) {
        reject(new Error("Mất kết nối, vui lòng thử lại"));
        return;
      }
      socket.emit(
        "chat:send",
        {
          conversationId,
          content,
          type: "text",
          clientMessageId,
          replyToMessageId: replyToMessageId ?? null,
          mentions: mentionsPayload ?? [],
        },
        (response) => {
          if (response?.ok) {
            resolve(response.data);
          } else {
            reject(new Error(response?.message || "Gửi tin nhắn thất bại"));
          }
        },
      );
    });

  const sendMessage = async (content, options = {}) => {
    if (!content || !conversationId || sending) return;

    const { replyToMessage = null, mentions = [] } = options;
    const replyToMessageId = replyToMessage?._id ?? null;
    const mentionsPayload = buildMentionsPayload(mentions);

    const senderId = buildSenderId();
    if (!senderId) {
      console.warn("sendMessage: missing user info", user);
      return;
    }

    const clientMessageId = makeClientMessageId();

    const optimisticMessage = {
      _id: clientMessageId,
      clientMessageId,
      conversationId,
      senderId,
      content,
      type: "text",
      seenBy: [],
      status: "sending",
      createdAt: new Date().toISOString(),
      replyTo: buildReplySnapshot(replyToMessage),
      mentions: buildMentionsSnapshot(mentions),
    };

    dispatch(appendMessage({ conversationId, message: optimisticMessage }));
    dispatch(
      upsertConversation({
        _id: conversationId,
        lastMessage: optimisticMessage,
      }),
    );

    setSending(true);

    try {
      await emitTextMessage(
        content,
        clientMessageId,
        replyToMessageId,
        mentionsPayload,
      );
    } catch (error) {
      const socket = getChatSocket();
      if (!socket?.connected) {
        retryQueueRef.current.push({
          clientMessageId,
          content,
          replyToMessageId,
          mentionsPayload,
        });
      }
      dispatch(
        updateMessageStatus({
          conversationId,
          clientMessageId,
          status: "failed",
        }),
      );
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;

    const flushRetryQueue = async () => {
      const queue = retryQueueRef.current;
      if (queue.length === 0) return;
      retryQueueRef.current = [];

      for (const item of queue) {
        dispatch(
          updateMessageStatus({
            conversationId,
            clientMessageId: item.clientMessageId,
            status: "sending",
          }),
        );
        try {
          await emitTextMessage(
            item.content,
            item.clientMessageId,
            item.replyToMessageId,
            item.mentionsPayload,
          );
        } catch {
          dispatch(
            updateMessageStatus({
              conversationId,
              clientMessageId: item.clientMessageId,
              status: "failed",
            }),
          );
        }
      }
      scrollToBottom();
    };

    socket.on("connect", flushRetryQueue);
    return () => socket.off("connect", flushRetryQueue);
  }, [conversationId]);

  useEffect(() => {
    retryQueueRef.current = [];
  }, [conversationId]);

  const sendImageMessage = async (file) => {
    if (!file || !conversationId || sending) return;

    const senderId = buildSenderId();
    if (!senderId) {
      console.warn("sendImageMessage: missing user info", user);
      return;
    }

    const clientMessageId = makeClientMessageId();

    const optimisticMessage = {
      _id: clientMessageId,
      clientMessageId,
      conversationId,
      senderId,
      content: "",
      type: "image",
      seenBy: [],
      status: "sending",
      createdAt: new Date().toISOString(),
      attachment: {
        url: file.uri,
        mimeType: file.type ?? file.mimeType,
        width: file.width ?? null,
        height: file.height ?? null,
      },
    };

    dispatch(appendMessage({ conversationId, message: optimisticMessage }));
    dispatch(
      upsertConversation({
        _id: conversationId,
        lastMessage: optimisticMessage,
      }),
    );

    setSending(true);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: file.uri,
        name: file.fileName ?? file.name ?? "photo.jpg",
        type: file.type ?? file.mimeType ?? "image/jpeg",
      });
      formData.append("clientMessageId", clientMessageId);

      const res = await chatApi.sendMessage(conversationId, formData);
      const message = res?.data?.data;

      if (message) {
        dispatch(appendMessage({ conversationId, message }));
      }
    } catch (error) {
      dispatch(
        updateMessageStatus({
          conversationId,
          clientMessageId,
          status: "failed",
        }),
      );
    } finally {
      setSending(false);
      scrollToBottom();
    }
  };

  return {
    sendMessage,
    sendImageMessage,
    sending,
  };
}
