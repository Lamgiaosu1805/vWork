import api from "../../../api/axiosInstance";

const customerApi = {
  getMyCustomers: (params) =>
    api.get("/customer/my-customers", { requiresAuth: true, params }),
  getAllCustomers: (params) =>
    api.get("/customer/all", { requiresAuth: true, params }),
  getDetailInfo: (params) =>
    api.get("/customer/detail-info-customer", { requiresAuth: true, params }),
  getFluctuation: (params) =>
    api.get("/customer/fluctuation", { requiresAuth: true, params }),
  getInvestmentHolding: (params) =>
    api.get("/customer/investment-holding", { requiresAuth: true, params }),
  getStaffInfo: (params) =>
    api.get("/customer/staff-info", { requiresAuth: true, params }),
  assign: (id, payload) =>
    api.post(`/customer/${id}/assign`, payload, { requiresAuth: true }),
  reassign: (id, payload) =>
    api.patch(`/customer/${id}/reassign`, payload, { requiresAuth: true }),
  unassignSale: (id, payload) =>
    api.patch(`/customer/${id}/unassign-sale`, payload, { requiresAuth: true }),
};

export default customerApi;
