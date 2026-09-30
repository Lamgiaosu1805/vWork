import { useQuery } from "@tanstack/react-query";
import investmentStatsApi from "../api/investmentStatsApi";

const useExpiringInvestments = (days) =>
  useQuery({
    queryKey: ["crmExpiringInvestments", days],
    queryFn: async () => {
      const res = await investmentStatsApi.getExpiring({ days });
      return res.data;
    },
  });

export default useExpiringInvestments;
