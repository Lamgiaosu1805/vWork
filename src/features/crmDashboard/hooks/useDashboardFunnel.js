import { useQuery } from "@tanstack/react-query";
import dashboardApi from "../api/dashboardApi";

const useDashboardFunnel = (params, enabled) =>
  useQuery({
    queryKey: ["crmDashboardFunnel", params],
    queryFn: async () => {
      const res = await dashboardApi.getFunnel(params);
      return res.data?.data ?? res.data;
    },
    enabled,
  });

export default useDashboardFunnel;
