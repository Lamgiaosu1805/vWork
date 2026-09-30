import { useQuery } from "@tanstack/react-query";
import investmentStatsApi from "../api/investmentStatsApi";

const useSalesLeaderboard = (period) =>
  useQuery({
    queryKey: ["crmSalesLeaderboard", period],
    queryFn: async () => {
      const res = await investmentStatsApi.getLeaderboard({ period });
      return res.data?.leaderboard ?? [];
    },
  });

export default useSalesLeaderboard;
