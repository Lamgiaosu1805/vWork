import { useQuery } from "@tanstack/react-query";
import investmentStatsApi from "../api/investmentStatsApi";

const useConversionFunnel = () =>
  useQuery({
    queryKey: ["crmConversionFunnel"],
    queryFn: async () => {
      const res = await investmentStatsApi.getConversion();
      return res.data;
    },
  });

export default useConversionFunnel;
