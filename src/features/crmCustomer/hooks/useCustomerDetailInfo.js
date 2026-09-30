import { useQuery } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useCustomerDetailInfo = (externalId) =>
  useQuery({
    queryKey: ["crmCustomerDetailInfo", externalId],
    queryFn: async () => {
      const res = await customerApi.getDetailInfo({ external_id: externalId });
      return res?.data?.data ?? null;
    },
    enabled: !!externalId,
  });

export default useCustomerDetailInfo;
