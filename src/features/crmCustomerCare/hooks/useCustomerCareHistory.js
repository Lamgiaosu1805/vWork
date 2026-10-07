import { useQuery } from "@tanstack/react-query";
import customerCareApi from "../api/customerCareApi";
import { CARE_QUERY_KEYS } from "../lib/queryKeys";

const useCustomerCareHistory = (customerId, enabled = true) =>
  useQuery({
    queryKey: CARE_QUERY_KEYS.history(customerId),
    queryFn: async () => {
      const res = await customerCareApi.getCustomerHistory(customerId);
      return res.data?.data ?? { state: null, history: [] };
    },
    enabled: !!customerId && enabled,
  });

export default useCustomerCareHistory;
