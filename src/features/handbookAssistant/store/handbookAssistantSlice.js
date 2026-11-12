import { createSlice } from "@reduxjs/toolkit";

// Hội thoại mới chưa được server cấp id — tin nhắn nằm tạm dưới khoá này tới khi nhận ack/start.
export const DRAFT_CONVERSATION_KEY = "__draft__";

export const conversationKeyOf = (conversationId) => conversationId ?? DRAFT_CONVERSATION_KEY;

const initialState = {
  isScreenOpen: false,
  activeConversationId: null,
  // { [conversationId | DRAFT_CONVERSATION_KEY]: Message[] } — có khoá nghĩa là đã nạp lịch sử.
  messagesByConversation: {},
  // Câu trả lời đang chạy: { clientId, messageId, conversationKey, conversationId, question, text,
  // cancelRequested, cancelSent, resynced }. resynced = đã hỏi lại cùng clientId sau khi mất kết nối:
  // delta lúc mất mạng đã mất nên không nối tiếp nữa, chờ `done` mang toàn văn.
  streaming: null,
  inputDraft: "",
  // Có câu trả lời xong khi người dùng không ở màn trợ lý → chấm đỏ trên VINNY nổi.
  hasUnreadAnswer: false,
  // VINNY nổi bị người dùng tắt (×) trên máy này; null = chưa đọc xong AsyncStorage.
  floatingHidden: null,
};

const findStreamTarget = (state, { messageId, clientId }) => {
  const s = state.streaming;
  if (!s) return null;
  if (messageId && s.messageId === messageId) return s;
  if (clientId && s.clientId === clientId) return s;
  return null;
};

const findAssistant = (state, key, s) =>
  state.messagesByConversation[key]?.find(
    (m) => m.role === "assistant" && (m.clientId === s.clientId || (s.messageId && m.id === s.messageId)),
  );

const handbookAssistantSlice = createSlice({
  name: "handbookAssistant",
  initialState,
  reducers: {
    setScreenOpen: (state, { payload }) => {
      state.isScreenOpen = payload;
      if (payload) state.hasUnreadAnswer = false;
    },

    setInputDraft: (state, { payload }) => {
      state.inputDraft = payload;
    },

    selectConversation: (state, { payload: conversationId }) => {
      state.activeConversationId = conversationId;
    },

    startNewConversation: (state) => {
      if (state.streaming?.conversationKey !== DRAFT_CONVERSATION_KEY) {
        delete state.messagesByConversation[DRAFT_CONVERSATION_KEY];
      }
      state.activeConversationId = null;
    },

    hydrateMessages: (state, { payload: { conversationId, messages } }) => {
      // Không ghi đè hội thoại đang có câu trả lời chạy.
      if (state.streaming?.conversationKey === conversationId) return;
      state.messagesByConversation[conversationId] = messages;
    },

    removeConversation: (state, { payload: conversationId }) => {
      delete state.messagesByConversation[conversationId];
      if (state.activeConversationId === conversationId) state.activeConversationId = null;
    },

    // Thêm câu hỏi + chỗ trống cho câu trả lời, bắt đầu một lượt.
    addQuestion: (state, { payload: { conversationId, clientId, question } }) => {
      const conversationKey = conversationKeyOf(conversationId);
      const now = new Date().toISOString();
      const list = state.messagesByConversation[conversationKey] ?? [];
      list.push(
        { id: `${clientId}:q`, clientId, role: "user", content: question, createdAt: now },
        {
          id: null,
          clientId,
          role: "assistant",
          question,
          content: "",
          citations: [],
          status: "pending",
          createdAt: now,
        },
      );
      state.messagesByConversation[conversationKey] = list;
      state.streaming = {
        clientId,
        messageId: null,
        conversationKey,
        conversationId,
        question,
        text: "",
        cancelRequested: false,
        cancelSent: false,
        resynced: false,
      };
    },

    // Ack hoặc handbook:start — gắn messageId/conversationId thật cho lượt đang chạy.
    bindStream: (state, { payload: { clientId, conversationId, messageId } }) => {
      const target = findStreamTarget(state, { clientId, messageId });
      if (!target) return;

      if (target.conversationKey === DRAFT_CONVERSATION_KEY && conversationId) {
        state.messagesByConversation[conversationId] = [
          ...(state.messagesByConversation[conversationId] ?? []),
          ...(state.messagesByConversation[DRAFT_CONVERSATION_KEY] ?? []),
        ];
        delete state.messagesByConversation[DRAFT_CONVERSATION_KEY];
        target.conversationKey = conversationId;
        target.conversationId = conversationId;
        if (state.activeConversationId === null) state.activeConversationId = conversationId;
      }

      if (messageId) target.messageId = messageId;
      const assistant = findAssistant(state, target.conversationKey, target);
      if (assistant) assistant.id = target.messageId;
    },

    appendStreamText: (state, { payload: { messageId, text } }) => {
      const s = state.streaming;
      if (!s || s.messageId !== messageId || !text || s.resynced) return;
      if (s.text === "") {
        const assistant = findAssistant(state, s.conversationKey, s);
        if (assistant) assistant.status = "streaming";
      }
      s.text += text;
    },

    finishStream: (state, { payload: { messageId, text, citations, truncated } }) => {
      const target = findStreamTarget(state, { messageId });
      if (!target) return;
      const assistant = findAssistant(state, target.conversationKey, target);
      if (assistant) {
        Object.assign(assistant, {
          id: messageId,
          content: text ?? target.text,
          citations: citations ?? [],
          truncated: Boolean(truncated),
          status: "done",
        });
      }
      state.streaming = null;
      state.hasUnreadAnswer = !state.isScreenOpen;
    },

    // Lỗi từ ack (theo clientId) hoặc handbook:error (theo messageId). CANCELLED giữ phần đã trả lời.
    failStream: (state, { payload: { messageId, clientId, code, message } }) => {
      const target = findStreamTarget(state, { messageId, clientId });
      if (!target) return;
      const assistant = findAssistant(state, target.conversationKey, target);
      if (assistant) {
        Object.assign(assistant, {
          content: target.text,
          status: code === "CANCELLED" ? "cancelled" : "error",
          errorCode: code,
          errorMessage: message ?? null,
        });
      }
      state.streaming = null;
    },

    requestCancel: (state) => {
      if (state.streaming) state.streaming.cancelRequested = true;
    },

    markCancelSent: (state) => {
      if (state.streaming) state.streaming.cancelSent = true;
    },

    markResynced: (state) => {
      if (state.streaming) state.streaming.resynced = true;
    },

    // Bỏ cặp hỏi/đáp lỗi (dùng khi hỏi lại một câu chưa từng tới được server).
    removeTurn: (state, { payload: { conversationKey, clientId } }) => {
      const list = state.messagesByConversation[conversationKey];
      if (!list) return;
      state.messagesByConversation[conversationKey] = list.filter((m) => m.clientId !== clientId);
    },

    setFeedback: (state, { payload: { conversationKey, messageId, feedback } }) => {
      const m = state.messagesByConversation[conversationKey]?.find((x) => x.id === messageId);
      if (m) m.feedback = feedback;
    },

    setFloatingHidden: (state, { payload }) => {
      state.floatingHidden = payload;
    },

    resetHandbookAssistant: () => initialState,
  },
});

export const {
  setScreenOpen,
  setInputDraft,
  selectConversation,
  startNewConversation,
  hydrateMessages,
  removeConversation,
  addQuestion,
  bindStream,
  appendStreamText,
  finishStream,
  failStream,
  requestCancel,
  markCancelSent,
  markResynced,
  removeTurn,
  setFeedback,
  setFloatingHidden,
  resetHandbookAssistant,
} = handbookAssistantSlice.actions;

export default handbookAssistantSlice.reducer;
