import { useQuery } from "@tanstack/react-query";
import printApi from "../api/printApi";

const usePrintStats = () =>
  useQuery({
    queryKey: ["print", "stats"],
    queryFn: async () => {
      const res = await printApi.getStats();
      return res.data ?? res;
    },
  });

export default usePrintStats;
