import api from "../axiosInstance";

const getListCustomers = async () => {
  return api.get("/customer/my-customers", {
    requiresAuth: true,
  });
};

const getAllCustomers = async (params = {}) => {
  return api.get("/customer/all", {
    requiresAuth: true,
    params,
  });
};

export { getListCustomers, getAllCustomers };
