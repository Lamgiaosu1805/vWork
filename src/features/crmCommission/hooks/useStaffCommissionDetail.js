import { useQuery } from "@tanstack/react-query";
import commissionApi from "../api/commissionApi";

const useStaffCommissionDetail = (saleId, month, year) =>
  useQuery({
    queryKey: ["crmStaffCommissionDetail", saleId, month, year],
    queryFn: async () => {
      const res = await commissionApi.getStaffCommission({ month, year, sale_id: saleId });
      return res.data;
    },
    enabled: !!saleId,
  });

export default useStaffCommissionDetail;
