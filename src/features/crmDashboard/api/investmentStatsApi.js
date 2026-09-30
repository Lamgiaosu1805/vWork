import api from "../../../api/axiosInstance";

const investmentStatsApi = {
  getSalesChart: (params) =>
    api.get("/investments/sales-chart", { requiresAuth: true, params }),
  getExpiring: (params) =>
    api.get("/investments/expiring", { requiresAuth: true, params }),
  getLeaderboard: (params) =>
    api.get("/investments/leaderboard", { requiresAuth: true, params }),
  getConversion: (params) =>
    api.get("/investments/conversion", { requiresAuth: true, params }),
};

export default investmentStatsApi;
