import api from "../../../api/axiosInstance";

const customerCallApi = {
  getCustomersToCall: (params) =>
    api.get("/customer-call/customers", { requiresAuth: true, params }),
  updateRelationshipStatus: (id, status) =>
    api.patch(`/customer-call/customers/${id}/relationship-status`, { status }, { requiresAuth: true }),
  recordCallAttempt: (id) =>
    api.post(`/customer-call/customers/${id}/call-attempts`, {}, { requiresAuth: true }),
  getCallHistory: (params) =>
    api.get("/customer-call/history", { requiresAuth: true, params }),
  updateCallLogNote: (id, note) =>
    api.patch(`/customer-call/history/${id}/note`, { note }, { requiresAuth: true }),
};

export default customerCallApi;
