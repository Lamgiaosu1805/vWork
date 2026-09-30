import { useQuery } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useAllCustomersTotal = (enabled, appCode) =>
  useQuery({
    queryKey: ["crmAllCustomersTotal", appCode],
    queryFn: async () => {
      const res = await customerApi.getAllCustomers({ page: 1, limit: 1, ...(appCode && { app_code: appCode }) });
      return res.data?.pagination?.total ?? 0;
    },
    enabled,
  });

export default useAllCustomersTotal;
