import { useQuery } from "@tanstack/react-query";
import dashboardApi from "../api/dashboardApi";

const useDashboardFunnelCustomers = (stage, params, page) =>
  useQuery({
    queryKey: ["crmDashboardFunnelCustomers", stage, params, page],
    queryFn: async () => {
      const res = await dashboardApi.getFunnelCustomers(stage, { ...params, page, limit: 10 });
      return {
        customers: res.data?.data ?? [],
        pagination: res.data?.pagination ?? { page: 1, total_pages: 1, total: 0 },
      };
    },
    enabled: !!stage,
  });

export default useDashboardFunnelCustomers;
