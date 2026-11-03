import api from "../../../api/axiosInstance";

const customerCareApi = {
  getMyQueue: () => api.get("/customer-care/my-queue", { requiresAuth: true }),
  getCustomerHistory: (customerId) =>
    api.get(`/customer-care/customers/${customerId}/history`, { requiresAuth: true }),
  getInteractions: (externalId, params) =>
    api.get(`/customer/interactions/${externalId}`, { requiresAuth: true, params }),
  createInteraction: (externalId, body) =>
    api.post(`/customer/interactions/${externalId}`, body, { requiresAuth: true }),
  getDashboard: (params) => api.get("/customer-care/dashboard", { requiresAuth: true, params }),
  getSales: (params) => api.get("/customer-care/sales", { requiresAuth: true, params }),
  updateSaleAllocation: (saleId, body, params) =>
    api.patch(`/customer-care/sales/${saleId}/allocation`, body, { requiresAuth: true, params }),
};

export default customerCareApi;
