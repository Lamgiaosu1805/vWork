import { useInfiniteQuery } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const PAGE_SIZE = 10;

const useAllCustomersList = (params = {}, options = {}) =>
  useInfiniteQuery({
    queryKey: ["crmAllCustomersList", params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await customerApi.getAllCustomers({ ...params, page: pageParam, limit: PAGE_SIZE });
      return {
        items: res.data?.data ?? [],
        total: res.data?.pagination?.total ?? 0,
        page: res.data?.pagination?.page ?? pageParam,
        totalPages: res.data?.pagination?.total_pages ?? 1,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    ...options,
  });

export default useAllCustomersList;
