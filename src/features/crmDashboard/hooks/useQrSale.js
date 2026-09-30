import { useQuery } from "@tanstack/react-query";
import homeApi from "../api/homeApi";

const useQrSale = (appCode) =>
  useQuery({
    queryKey: ["crmQrSale", appCode],
    queryFn: async () => {
      const res = await homeApi.getQrSale(appCode ? { app_code: appCode } : undefined);
      return res.data;
    },
  });

export default useQrSale;
