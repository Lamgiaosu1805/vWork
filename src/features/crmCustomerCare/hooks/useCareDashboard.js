import { useQuery } from "@tanstack/react-query";
import customerCareApi from "../api/customerCareApi";
import { CARE_QUERY_KEYS } from "../lib/queryKeys";

const useCareDashboard = (params, enabled = true) =>
  useQuery({
    queryKey: CARE_QUERY_KEYS.dashboard(params),
    queryFn: async () => {
      const res = await customerCareApi.getDashboard(params);
      return res.data?.data ?? null;
    },
    enabled,
  });

export default useCareDashboard;
