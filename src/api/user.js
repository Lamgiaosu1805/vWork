import api from "./axiosInstance";

const getBirthdayThisMonthApi = async () => {
  return api.get("/user/birthday/this-month", { requiresAuth: true });
};

const getUsersApi = async (params = {}) => {
  return api.get("/user/getUsers", { requiresAuth: true, params });
};

export { getBirthdayThisMonthApi, getUsersApi };
