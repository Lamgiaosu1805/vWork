import api from "../../../api/axiosInstance";

const homeApi = {
  getQrSale: (params) => api.get("/user/getQRSale", { requiresAuth: true, params }),
  getChurnRisks: () => api.get("/ai/churn-risks", { requiresAuth: true }),
};

export default homeApi;
