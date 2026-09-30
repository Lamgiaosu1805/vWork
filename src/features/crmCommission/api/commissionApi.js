import api from "../../../api/axiosInstance";

const commissionApi = {
  getMyCommission: (params) =>
    api.get("/investments/my-commission", { requiresAuth: true, params }),
  getStaffCommission: (params) =>
    api.get("/investments/staff-commission", { requiresAuth: true, params }),
};

export default commissionApi;
