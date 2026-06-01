import api from "./axiosInstance";

const chatApi = {
  createPrivateConversation: (payload) =>
    api.post("/chat/private", payload, { requiresAuth: true }),

  createGroupConversation: (payload) =>
    api.post("/chat/group", payload, { requiresAuth: true }),

  getConversations: () =>
    api.get("/chat/conversations", { requiresAuth: true }),

  getConversation: (conversationId) =>
    api.get(`/chat/conversations/${conversationId}`, { requiresAuth: true }),

  getMessages: (conversationId, page = 1, limit = 30) =>
    api.get(`/chat/conversations/${conversationId}/messages`, {
      requiresAuth: true,
      params: { page, limit },
    }),

  sendMessage: (conversationId, payload) =>
    api.post(`/chat/conversations/${conversationId}/messages`, payload, {
      requiresAuth: true,
    }),

  markConversationSeen: (conversationId) =>
    api.patch(
      `/chat/conversations/${conversationId}/seen`,
      {},
      {
        requiresAuth: true,
      },
    ),

  updateGroupConversationName: (conversationId, payload) =>
    api.patch(`/chat/conversations/${conversationId}/group-name`, payload, {
      requiresAuth: true,
    }),

  deleteMessage: (conversationId, messageId) =>
    api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`, {
      requiresAuth: true,
    }),

  deleteConversation: (conversationId) =>
    api.delete(`/chat/conversations/${conversationId}`, { requiresAuth: true }),
};

export default chatApi;
