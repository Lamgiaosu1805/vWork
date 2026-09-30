import { useQuery } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useCustomerStaffInfo = (maNv) =>
  useQuery({
    queryKey: ["crmCustomerStaffInfo", maNv],
    queryFn: async () => {
      const res = await customerApi.getStaffInfo({ ma_nv: maNv });
      return res?.data?.data ?? null;
    },
    enabled: !!maNv,
  });

export default useCustomerStaffInfo;
