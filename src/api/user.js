import api from "./axiosInstance";

const getBirthdayThisMonthApi = async () => {
  return api.get("/user/birthday/this-month", {
    requiresAuth: true,
  });
};

export { getBirthdayThisMonthApi };
