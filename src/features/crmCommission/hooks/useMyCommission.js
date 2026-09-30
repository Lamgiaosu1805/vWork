import { useQuery } from "@tanstack/react-query";
import commissionApi from "../api/commissionApi";

const useMyCommission = (month, year, appCode) =>
  useQuery({
    queryKey: ["crmMyCommission", month, year, appCode],
    queryFn: async () => {
      const res = await commissionApi.getMyCommission({ month, year, ...(appCode && { app_code: appCode }) });
      return res.data;
    },
  });

export default useMyCommission;
