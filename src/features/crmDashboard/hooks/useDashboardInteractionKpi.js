import { useQuery } from "@tanstack/react-query";
import dashboardApi from "../api/dashboardApi";

const useDashboardInteractionKpi = (params, enabled) =>
  useQuery({
    queryKey: ["crmDashboardInteractionKpi", params],
    queryFn: async () => {
      const res = await dashboardApi.getInteractionKpi(params);
      return res.data?.data ?? res.data;
    },
    enabled,
  });

export default useDashboardInteractionKpi;
