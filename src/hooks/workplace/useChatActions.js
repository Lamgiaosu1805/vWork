import { useState } from "react";
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

  const sendMessage = async (content) => {
    if (!content || !conversationId || sending) return;

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
      const socket = getChatSocket();

      if (!socket?.connected) {
        throw new Error("Mất kết nối, vui lòng thử lại");
      }

      await new Promise((resolve, reject) => {
        socket.emit(
          "chat:send",
          { conversationId, content, type: "text", clientMessageId },
          (response) => {
            if (response?.ok) {
              resolve(response.data);
            } else {
              reject(new Error(response?.message || "Gửi tin nhắn thất bại"));
            }
          },
        );
      });
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
        url: file.uri, // preview local trước khi server trả url thật
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
