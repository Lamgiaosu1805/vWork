import { useQuery } from "@tanstack/react-query";
import dashboardApi from "../api/dashboardApi";

const useDashboardAumQuality = (params, enabled) =>
  useQuery({
    queryKey: ["crmDashboardAumQuality", params],
    queryFn: async () => {
      const res = await dashboardApi.getAumQuality(params);
      return res.data?.data ?? res.data;
    },
    enabled,
  });

export default useDashboardAumQuality;
