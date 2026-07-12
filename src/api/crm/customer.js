import api from "../axiosInstance";

const getListCustomers = async (params = {}) => {
  return api.get("/customer/my-customers", {
    requiresAuth: true,
    params,
  });
};

const getAllCustomers = async (params = {}) => {
  return api.get("/customer/all", {
    requiresAuth: true,
    params,
  });
};

const getCustomerDetailInfoApi = async (params = {}) => {
  return api.get("/customer/detail-info-customer", {
    requiresAuth: true,
    params,
  });
};

const getCustomerFluctuationApi = async (params = {}) => {
  return api.get("/customer/fluctuation", {
    requiresAuth: true,
    params,
  });
};

const viewImageApi = async (params = {}) => {
  return api.get("/customer/view-image", {
    requiresAuth: true,
    params,
  });
};

const getInvestmentHoldingApi = async (params = {}) => {
  return api.get("/customer/investment-holding", {
    requiresAuth: true,
    params,
  });
};

const getStaffInfoApi = async (params = {}) => {
  return api.get("/customer/staff-info", {
    requiresAuth: true,
    params,
  });
};

const getCustomerInteractions = async (externalId, params = {}) => {
  return api.get(`/customer/interactions/${externalId}`, {
    requiresAuth: true,
    params,
  });
};

const createCustomerInteraction = async (externalId, data) => {
  return api.post(`/customer/interactions/${externalId}`, data, {
    requiresAuth: true,
  });
};

export {
  getListCustomers,
  getAllCustomers,
  getCustomerDetailInfoApi,
  getCustomerFluctuationApi,
  viewImageApi,
  getInvestmentHoldingApi,
  getStaffInfoApi,
  getCustomerInteractions,
  createCustomerInteraction,
};
