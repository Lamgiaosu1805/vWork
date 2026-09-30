import api from "../../../api/axiosInstance";

const claimRequestApi = {
  create: (payload) => api.post("/customer-claim-request", payload, { requiresAuth: true }),
  getMine: (params) => api.get("/customer-claim-request/mine", { requiresAuth: true, params }),
  getAll: (params) => api.get("/customer-claim-request", { requiresAuth: true, params }),
  approve: (id) => api.patch(`/customer-claim-request/${id}/approve`, {}, { requiresAuth: true }),
  reject: (id, payload) => api.patch(`/customer-claim-request/${id}/reject`, payload, { requiresAuth: true }),
  revoke: (id, payload) => api.patch(`/customer-claim-request/${id}/revoke`, payload, { requiresAuth: true }),
};

export default claimRequestApi;
