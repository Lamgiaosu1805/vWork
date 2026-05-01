import api from "../axiosInstance";

const getListCustomers = async () => {
  return api.get("/customer/my-customers", {
    requiresAuth: true,
  });
};

export { getListCustomers };
