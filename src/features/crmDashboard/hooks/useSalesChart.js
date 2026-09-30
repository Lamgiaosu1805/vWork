import { useQuery } from "@tanstack/react-query";
import investmentStatsApi from "../api/investmentStatsApi";

const useSalesChart = (period, branchId) =>
  useQuery({
    queryKey: ["crmSalesChart", period, branchId],
    queryFn: async () => {
      const params = { period };
      if (branchId) params.branch_id = branchId;
      const res = await investmentStatsApi.getSalesChart(params);
      return res.data;
    },
  });

export default useSalesChart;
