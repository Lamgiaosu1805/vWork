import { useQuery } from "@tanstack/react-query";
import commissionApi from "../api/commissionApi";

const useStaffCommission = (month, year, enabled) =>
  useQuery({
    queryKey: ["crmStaffCommission", month, year],
    queryFn: async () => {
      const res = await commissionApi.getStaffCommission({ month, year });
      return res.data?.data ?? [];
    },
    enabled,
  });

export default useStaffCommission;
