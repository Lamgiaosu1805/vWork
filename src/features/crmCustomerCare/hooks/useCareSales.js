import { useQuery } from "@tanstack/react-query";
import customerCareApi from "../api/customerCareApi";
import { CARE_QUERY_KEYS } from "../lib/queryKeys";

const useCareSales = (appCode, enabled = true) =>
  useQuery({
    queryKey: CARE_QUERY_KEYS.sales(appCode),
    queryFn: async () => {
      const res = await customerCareApi.getSales({ appCode });
      return res.data?.data ?? [];
    },
    enabled,
  });

export default useCareSales;
