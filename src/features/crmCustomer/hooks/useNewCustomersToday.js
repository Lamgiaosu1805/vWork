import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import customerApi from "../api/customerApi";

const useNewCustomersToday = (isManager, appCode) => {
  const today = dayjs().format("YYYY-MM-DD");

  return useQuery({
    queryKey: ["crmNewCustomersToday", isManager, today, appCode],
    queryFn: async () => {
      const params = {
        page: 1,
        limit: 1,
        from_date: dayjs().startOf("day").toISOString(),
        to_date: dayjs().endOf("day").toISOString(),
        ...(appCode && { app_code: appCode }),
      };
      const res = isManager
        ? await customerApi.getAllCustomers(params)
        : await customerApi.getMyCustomers(params);
      return res.data?.pagination?.total ?? 0;
    },
  });
};

export default useNewCustomersToday;
