import { useInfiniteQuery } from "@tanstack/react-query";
import customerCallApi from "../api/customerCallApi";

const PAGE_SIZE = 10;

const useCustomersToCall = (params = {}, options = {}) =>
  useInfiniteQuery({
    queryKey: ["crmCustomersToCall", params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await customerCallApi.getCustomersToCall({ ...params, page: pageParam, limit: PAGE_SIZE });
      const total = res.data?.total ?? 0;
      return {
        items: res.data?.data ?? [],
        total,
        page: res.data?.page ?? pageParam,
        totalPages: Math.max(1, Math.ceil(total / (res.data?.limit ?? PAGE_SIZE))),
      };
    },
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    ...options,
  });

export default useCustomersToCall;
