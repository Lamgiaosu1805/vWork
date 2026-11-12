import api from "../../../api/axiosInstance";

const PREFIX = "/handbook-assistant";
const AUTH = { requiresAuth: true };

const handbookAssistantApi = {
  getConversations: () => api.get(`${PREFIX}/conversations`, AUTH),

  getConversationMessages: (conversationId) =>
    api.get(`${PREFIX}/conversations/${conversationId}/messages`, AUTH),

  deleteConversation: (conversationId) =>
    api.delete(`${PREFIX}/conversations/${conversationId}`, AUTH),

  /** @param {{ value: 1 | -1, comment?: string }} body */
  sendFeedback: (messageId, body) =>
    api.post(`${PREFIX}/messages/${messageId}/feedback`, body, AUTH),

  // documentCode có thể mang phiên bản ("NOI_QUY@3") để mở đúng văn bản lúc trả lời.
  getArticle: (documentCode, idx) =>
    api.get(
      `${PREFIX}/articles/${encodeURIComponent(documentCode)}/${encodeURIComponent(idx)}`,
      AUTH,
    ),

  getQuota: () => api.get(`${PREFIX}/quota`, AUTH),

  getSuggestions: () => api.get(`${PREFIX}/suggestions`, AUTH),
};

export default handbookAssistantApi;
