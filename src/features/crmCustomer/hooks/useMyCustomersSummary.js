import { useQuery } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useMyCustomersSummary = (limit = 5, appCode) =>
  useQuery({
    queryKey: ["crmMyCustomersSummary", limit, appCode],
    queryFn: async () => {
      const res = await customerApi.getMyCustomers({ page: 1, limit, ...(appCode && { app_code: appCode }) });
      return {
        total: res.data?.pagination?.total ?? 0,
        recent: res.data?.data ?? [],
      };
    },
  });

export default useMyCustomersSummary;
