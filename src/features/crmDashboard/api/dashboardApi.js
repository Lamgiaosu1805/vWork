import api from "../../../api/axiosInstance";

const dashboardApi = {
  getKeyMetrics: (params) =>
    api.get("/dashboard/key-metrics", { requiresAuth: true, params }),
  getFunnel: (params) =>
    api.get("/dashboard/funnel", { requiresAuth: true, params }),
  getFunnelCustomers: (stage, params) =>
    api.get(`/dashboard/funnel/${stage}/customers`, { requiresAuth: true, params }),
  getAumQuality: (params) =>
    api.get("/dashboard/aum-quality", { requiresAuth: true, params }),
  getInteractionKpi: (params) =>
    api.get("/dashboard/interaction-kpi", { requiresAuth: true, params }),
};

export default dashboardApi;
