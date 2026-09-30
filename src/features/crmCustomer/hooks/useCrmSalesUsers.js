import { useQuery } from "@tanstack/react-query";
import { getUsersApi } from "../../../api/user";

const useCrmSalesUsers = (params = {}, options = {}) =>
  useQuery({
    queryKey: ["crmSalesUsers", params],
    queryFn: async () => {
      const res = await getUsersApi({ module: "crm", ...params });
      return res.data?.data ?? [];
    },
    ...options,
  });

export default useCrmSalesUsers;
