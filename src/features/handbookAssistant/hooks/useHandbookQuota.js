import { useQuery } from "@tanstack/react-query";
import handbookAssistantApi from "../api/handbookAssistantApi";
import { QUERY_KEYS } from "../constants";

// { limit, used, remaining, resetAt }
const useHandbookQuota = (enabled = true) => {
  const query = useQuery({
    queryKey: QUERY_KEYS.quota,
    queryFn: async () => {
      const res = await handbookAssistantApi.getQuota();
      return res.data?.data ?? null;
    },
    enabled,
    staleTime: 60_000,
  });
  return { ...query, quota: query.data };
};

export default useHandbookQuota;
