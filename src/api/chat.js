import api from "./axiosInstance";

// ─── Payload / Query types (JSDoc)

/**
 * @typedef {{ receiver_id: string }} CreatePrivatePayload
 * @typedef {{ name: string, members: string[] }} CreateGroupPayload
 * @typedef {{ name: string }} UpdateGroupNamePayload
 * @typedef {{ avatar: string }} UpdateGroupAvatarPayload
 * @typedef {{ content: string, type: string, clientMessageId?: string }} SendMessagePayload
 * @typedef {{ member_ids: string[] }} AddMembersPayload
 * @typedef {{ search?: string }} GetConversationsQuery
 * @typedef {{ search?: string, limit?: number }} SearchUsersQuery
 */

const chatApi = {
  /** @param {CreatePrivatePayload} payload */
  createPrivateConversation: (payload) =>
    api.post("/chat/private", payload, { requiresAuth: true }),

  /** @param {CreateGroupPayload} payload */
  createGroupConversation: (payload) =>
    api.post("/chat/group", payload, { requiresAuth: true }),

  /** @param {GetConversationsQuery} [query] */
  getConversations: (query = {}) =>
    api.get("/chat/conversations", {
      requiresAuth: true,
      params: query,
    }),

  /** @param {string} conversationId */
  getConversation: (conversationId) =>
    api.get(`/chat/conversations/${conversationId}`, { requiresAuth: true }),

  /**
   * @param {string} conversationId
   * @param {UpdateGroupNamePayload} payload
   */
  updateGroupConversationName: (conversationId, payload) =>
    api.patch(`/chat/conversations/${conversationId}/group-name`, payload, {
      requiresAuth: true,
    }),

  /**
   * @param {string} conversationId
   * @param {FormData} payload
   */
  updateGroupConversationAvatar: (conversationId, payload) =>
    api.patch(`/chat/conversations/${conversationId}/group-avatar`, payload, {
      requiresAuth: true,
      headers: { "Content-Type": "multipart/form-data" },
    }),

  /** @param {string} conversationId */
  deleteConversation: (conversationId) =>
    api.delete(`/chat/conversations/${conversationId}`, { requiresAuth: true }),

  /**
   * @param {string} conversationId
   * @param {number} [page=1]
   * @param {number} [limit=30]
   */
  getMessages: (conversationId, page = 1, limit = 30) =>
    api.get(`/chat/conversations/${conversationId}/messages`, {
      requiresAuth: true,
      params: { page, limit },
    }),

  /**
   * @param {string} conversationId
   * @param {SendMessagePayload|FormData} payload
   */
  sendMessage: (conversationId, payload) =>
    api.post(`/chat/conversations/${conversationId}/messages`, payload, {
      requiresAuth: true,
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
    }),

  /**
   * Thu hồi tin nhắn (cho tất cả thành viên).
   * @param {string} conversationId
   * @param {string} messageId
   */
  recallMessage: (conversationId, messageId) =>
    api.delete(`/chat/conversations/${conversationId}/messages/${messageId}`, {
      requiresAuth: true,
    }),

  /**
   * Xoá tin nhắn chỉ phía mình.
   * @param {string} conversationId
   * @param {string} messageId
   */
  deleteMessageForSelf: (conversationId, messageId) =>
    api.delete(
      `/chat/conversations/${conversationId}/messages/${messageId}/self`,
      { requiresAuth: true },
    ),

  /**
   * @param {string} conversationId
   * @param {AddMembersPayload} payload
   */
  addMembers: (conversationId, payload) =>
    api.post(`/chat/conversations/${conversationId}/members`, payload, {
      requiresAuth: true,
    }),

  /**
   * @param {string} conversationId
   * @param {string} memberId
   */
  kickMember: (conversationId, memberId) =>
    api.delete(`/chat/conversations/${conversationId}/members/${memberId}`, {
      requiresAuth: true,
    }),

  /**
   * @param {string} conversationId
   * @param {string} memberId
   */
  promoteMember: (conversationId, memberId) =>
    api.patch(
      `/chat/conversations/${conversationId}/members/${memberId}/promote`,
      {},
      { requiresAuth: true },
    ),

  /** @param {string} conversationId */
  leaveGroup: (conversationId) =>
    api.delete(`/chat/conversations/${conversationId}/members/me`, {
      requiresAuth: true,
    }),

  /** @param {SearchUsersQuery} [query] */
  searchUsers: (query = {}) =>
    api.get("/chat/users/search", {
      requiresAuth: true,
      params: query,
    }),

  getImageUrl: (conversationId, messageId) =>
    api.get(
      `/chat/conversations/${conversationId}/messages/${messageId}/image`,
      {
        requiresAuth: true,
      },
    ),

  /**
   * @param {string} conversationId
   * @param {string} memberId
   * @param {string} nickname
   */
  updateMemberNickname: (conversationId, memberId, nickname) =>
    api.patch(
      `/chat/conversations/${conversationId}/members/${memberId}/nickname`,
      { nickname },
      { requiresAuth: true },
    ),
};

export default chatApi;
