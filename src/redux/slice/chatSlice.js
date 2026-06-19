import { createSlice } from "@reduxjs/toolkit";
import {
  resolveConversationId,
  resolveMessageId,
  resolveMessageText,
  resolveSenderId,
  sortConversations,
  sortMessages,
} from "../../utils/chatUtils";

const initialState = {
  conversations: [],
  activeConversationId: null,
  messagesByConversationId: {},
  loadingConversations: false,
  loadingMessagesByConversationId: {},
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setLoadingConversations: (state, action) => {
      state.loadingConversations = Boolean(action.payload);
    },
    setConversations: (state, action) => {
      const conversations = Array.isArray(action.payload) ? action.payload : [];
      state.conversations = sortConversations(conversations);
    },
    upsertConversation: (state, action) => {
      const conversation = action.payload;
      const id = resolveConversationId(conversation);

      if (!id) return;

      const index = state.conversations.findIndex(
        (item) => resolveConversationId(item) === id,
      );

      if (index === -1) {
        state.conversations = sortConversations([
          conversation,
          ...state.conversations,
        ]);
        return;
      }

      state.conversations[index] = {
        ...state.conversations[index],
        ...conversation,
      };

      state.conversations = sortConversations(state.conversations);
    },
    setActiveConversationId: (state, action) => {
      state.activeConversationId = action.payload ?? null;
    },
    setLoadingMessages: (state, action) => {
      const { conversationId, loading } = action.payload ?? {};

      if (!conversationId) return;

      state.loadingMessagesByConversationId[conversationId] = Boolean(loading);
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload ?? {};

      if (!conversationId) return;

      state.messagesByConversationId[conversationId] = sortMessages(
        Array.isArray(messages) ? messages : [],
      );
    },
    appendMessage: (state, action) => {
      const { conversationId, message } = action.payload ?? {};

      if (!conversationId || !message) return;

      const current = state.messagesByConversationId[conversationId] ?? [];
      const messageId = resolveMessageId(message);
      const senderId = resolveSenderId(message);
      const messageText = String(resolveMessageText(message) ?? "").trim();
      const senderKey = String(senderId?._id ?? senderId ?? "");

      // prefer exact id match
      let index = -1;

      if (messageId) {
        index = current.findIndex((item) => {
          const currentId = resolveMessageId(item);
          return currentId ? String(currentId) === String(messageId) : false;
        });
      }

      // fallback: match by clientMessageId when provided
      if (index === -1 && message?.clientMessageId) {
        index = current.findIndex((item) =>
          item?.clientMessageId
            ? String(item.clientMessageId) === String(message.clientMessageId)
            : false,
        );
      }

      // last resort: match optimistic 'sending' item by sender + text
      if (index === -1) {
        index = current.findIndex((item) => {
          if (item?.status !== "sending") return false;
          const itemSenderKey = String(
            resolveSenderId(item)?._id ?? resolveSenderId(item) ?? "",
          );
          const itemText = String(resolveMessageText(item) ?? "").trim();
          return itemSenderKey === senderKey && itemText === messageText;
        });
      }

      if (index !== -1) {
        const next = [...current];
        next[index] = {
          ...next[index],
          ...message,
          status:
            message?.status ??
            (next[index]?.status === "sending" ? "sent" : next[index]?.status),
        };
        state.messagesByConversationId[conversationId] = sortMessages(next);
        return;
      }

      // append then cleanup duplicates (cover cases where matching failed earlier)
      const appended = sortMessages([...current, message]);

      // If message has clientMessageId, remove other entries with same clientMessageId
      if (message?.clientMessageId) {
        const seen = new Set();
        const filtered = appended.filter((m) => {
          if (!m?.clientMessageId) return true;
          if (seen.has(String(m.clientMessageId))) return false;
          seen.add(String(m.clientMessageId));
          return true;
        });
        state.messagesByConversationId[conversationId] = filtered;
        return;
      }

      // If no clientMessageId, remove older sending duplicates with same sender/text when we added a confirmed message
      if (message?.status !== "sending") {
        const deduped = appended.filter((m, idx, arr) => {
          // keep first occurrence of a given sender+trimmedText where status !== 'sending'
          const key = `${String(resolveSenderId(m)?._id ?? resolveSenderId(m) ?? "")}::${String(resolveMessageText(m) ?? "").trim()}`;
          // if m is sending and there exists a non-sending with same key, drop the sending one
          const hasConfirmed = arr.some((x) => {
            const k = `${String(resolveSenderId(x)?._id ?? resolveSenderId(x) ?? "")}::${String(resolveMessageText(x) ?? "").trim()}`;
            return k === key && x?.status !== "sending";
          });
          if (m?.status === "sending" && hasConfirmed) return false;
          return true;
        });
        state.messagesByConversationId[conversationId] = deduped;
        return;
      }

      state.messagesByConversationId[conversationId] = appended;
    },
    updateMessageStatus: (state, action) => {
      const { conversationId, clientMessageId, status, error } =
        action.payload ?? {};

      if (!conversationId || !clientMessageId) return;

      const current = state.messagesByConversationId[conversationId] ?? [];
      state.messagesByConversationId[conversationId] = current.map(
        (message) => {
          if (String(message?.clientMessageId) !== String(clientMessageId)) {
            return message;
          }

          return {
            ...message,
            status,
            error,
          };
        },
      );
    },
    markMessagesSeen: (state, action) => {
      const { conversationId, userInfoId } = action.payload ?? {};

      if (!conversationId || !userInfoId) return;

      const current = state.messagesByConversationId[conversationId] ?? [];
      const seenAt = new Date().toISOString();
      const currentUserInfoId = String(userInfoId);

      state.messagesByConversationId[conversationId] = current.map(
        (message) => {
          const senderId = String(
            resolveSenderId(message)?._id ?? resolveSenderId(message) ?? "",
          );
          const seenBy = Array.isArray(message?.seenBy) ? message.seenBy : [];
          const alreadySeen = seenBy.map(String).includes(currentUserInfoId);

          const shouldMarkSeen = senderId !== currentUserInfoId && !alreadySeen;

          if (!shouldMarkSeen) {
            return message;
          }

          return {
            ...message,
            seenAt,
            seen_at: seenAt,
            seenBy: Array.from(
              new Set([...seenBy.map(String), currentUserInfoId]),
            ),
            status: message?.status === "failed" ? message.status : "seen",
          };
        },
      );
    },
    deleteMessage: (state, action) => {
      const { conversationId, messageId } = action.payload ?? {};
      if (!conversationId || !messageId) return;

      const current = state.messagesByConversationId[conversationId] ?? [];
      state.messagesByConversationId[conversationId] = current.filter((m) => {
        const id = m?._id ?? m?.id ?? null;
        const clientId = m?.clientMessageId ?? null;
        return !(String(id) === String(messageId) || String(clientId) === String(messageId));
      });
    },
    deleteConversation: (state, action) => {
      const conversationId = action.payload;
      if (!conversationId) return;
      state.conversations = state.conversations.filter(
        (c) => String(resolveConversationId(c)) !== String(conversationId),
      );
      // remove messages cache
      if (state.messagesByConversationId[conversationId]) {
        delete state.messagesByConversationId[conversationId];
      }
    },
    clearActiveConversationId: (state) => {
      state.activeConversationId = null;
    },
    clearChatState: () => initialState,
  },
});

export const {
  setLoadingConversations,
  setConversations,
  upsertConversation,
  setActiveConversationId,
  setLoadingMessages,
  setMessages,
  appendMessage,
  updateMessageStatus,
  markMessagesSeen,
  deleteMessage,
  deleteConversation,
  clearActiveConversationId,
  clearChatState,
} = chatSlice.actions;

export default chatSlice.reducer;
