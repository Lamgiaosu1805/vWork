import api from "./axiosInstance";

const shiftApi = {
  getAllShifts: () => {
    return api.get("/attendance/getAllShifts", { requiresAuth: true });
  },
};

export default shiftApi;
