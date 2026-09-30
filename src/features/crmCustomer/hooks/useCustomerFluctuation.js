import { useInfiniteQuery } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useCustomerFluctuation = (externalId, dateRange = {}) =>
  useInfiniteQuery({
    queryKey: ["crmCustomerFluctuation", externalId, dateRange],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await customerApi.getFluctuation({
        external_id: externalId,
        limit: 10,
        page: pageParam,
        start_date: dateRange.from ? dateRange.from.format("YYYY-MM-DD") : null,
        end_date: dateRange.to ? dateRange.to.format("YYYY-MM-DD") : null,
      });
      return {
        items: res?.data?.data ?? [],
        pagination: res?.data?.pagination ?? { page: 1, total_pages: 1, total: 0 },
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.total_pages ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!externalId,
  });

export default useCustomerFluctuation;
