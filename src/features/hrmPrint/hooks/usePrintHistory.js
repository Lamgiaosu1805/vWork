import { useQuery } from "@tanstack/react-query";
import printApi from "../api/printApi";

const usePrintHistory = (limit = 10) =>
  useQuery({
    queryKey: ["print", "history", limit],
    queryFn: async () => {
      const res = await printApi.getHistory({ limit });
      return (res.data?.data ?? res.data) || [];
    },
  });

export default usePrintHistory;
