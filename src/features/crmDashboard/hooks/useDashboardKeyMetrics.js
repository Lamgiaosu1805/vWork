import { useQuery } from "@tanstack/react-query";
import dashboardApi from "../api/dashboardApi";

const useDashboardKeyMetrics = (params, enabled) =>
  useQuery({
    queryKey: ["crmDashboardKeyMetrics", params],
    queryFn: async () => {
      const res = await dashboardApi.getKeyMetrics(params);
      return res.data?.data ?? res.data;
    },
    enabled,
  });

export default useDashboardKeyMetrics;
