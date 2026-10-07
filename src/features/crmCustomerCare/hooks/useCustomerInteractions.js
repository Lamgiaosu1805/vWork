import { useInfiniteQuery } from "@tanstack/react-query";
import customerCareApi from "../api/customerCareApi";
import { CARE_QUERY_KEYS } from "../lib/queryKeys";

const PAGE_SIZE = 10;

const useCustomerInteractions = (externalId, enabled = true) =>
  useInfiniteQuery({
    queryKey: CARE_QUERY_KEYS.interactions(externalId),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await customerCareApi.getInteractions(externalId, { page: pageParam, limit: PAGE_SIZE });
      const pagination = res.data?.pagination ?? {};
      return {
        items: res.data?.data ?? [],
        total: pagination.total ?? 0,
        page: pagination.page ?? pageParam,
        totalPages: Math.max(1, pagination.total_pages ?? 1),
      };
    },
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!externalId && enabled,
  });

export default useCustomerInteractions;
