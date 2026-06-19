import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { connectChatSocket, getChatSocket } from "../../libs/chatSocket";
import {
  setActiveConversationId,
  clearActiveConversationId,
  upsertConversation,
} from "../../redux/slice/chatSlice";
import chatApi from "../../api/chat";

export default function useChatRoom({
  conversationId,
  accessToken,
  dispatch,
  setConversation,
  loadMessages,
  markSeen,
}) {
  const loadConversationMeta = useCallback(async () => {
    if (!conversationId) return;

    try {
      const res = await chatApi.getConversation(conversationId);

      const item = res?.data?.data ?? res?.data ?? res;

      if (item) {
        setConversation(item);
        dispatch(upsertConversation(item));
      }
    } catch (error) {
      console.log(error);
    }
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
      if (!conversationId) return;

      let socket = null;

      const joinRoom = () => {
        const instance = getChatSocket();

        if (instance?.connected) {
          instance.emit("chat:join", {
            conversationId,
          });

          instance.emit("chat:seen", {
            conversationId,
          });
        }
      };

      const bootstrap = async () => {
        dispatch(setActiveConversationId(conversationId));

        socket = await connectChatSocket(accessToken);

        if (socket) {
          socket.on("connect", joinRoom);
          socket.on("reconnect", joinRoom);
        }

        await Promise.all([loadConversationMeta(), loadMessages()]);

        if (socket?.connected) {
          joinRoom();
          markSeen();
        }
      };

      bootstrap();

      return () => {
        if (socket) {
          socket.emit("chat:leave", {
            conversationId,
          });

          socket.off("connect", joinRoom);
          socket.off("reconnect", joinRoom);
        }

        dispatch(clearActiveConversationId());
      };
    }, [
      accessToken,
      conversationId,
      loadConversationMeta,
      loadMessages,
      markSeen,
    ]),
  );

  return {
    loadConversationMeta,
  };
}
