import api from "../axiosInstance";

const rangeParams = (range = {}) => ({
  ...(range.from_date ? { from_date: range.from_date } : {}),
  ...(range.to_date ? { to_date: range.to_date } : {}),
});

export const getCrmExecutiveDashboard = async (range = {}) => {
  const params = rangeParams(range);
  const [metrics, funnel, aumQuality, interactionKpi] = await Promise.all([
    api.get("/dashboard/key-metrics", { requiresAuth: true, params }),
    api.get("/dashboard/funnel", { requiresAuth: true, params }),
    api.get("/dashboard/aum-quality", { requiresAuth: true, params }),
    api.get("/dashboard/interaction-kpi", { requiresAuth: true, params }),
  ]);
  return {
    metrics: metrics.data.data,
    funnel: funnel.data.data,
    aumQuality: aumQuality.data.data,
    interactionKpi: interactionKpi.data.data,
  };
};

export const getCrmFunnelCustomers = async (stage, params = {}) => {
  const response = await api.get(`/dashboard/funnel/${stage}/customers`, {
    requiresAuth: true,
    params: { ...rangeParams(params), page: params.page || 1, limit: params.limit || 10 },
  });
  return response.data;
};
