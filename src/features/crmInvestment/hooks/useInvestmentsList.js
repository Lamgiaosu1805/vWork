import { useInfiniteQuery } from "@tanstack/react-query";
import investmentApi from "../api/investmentApi";

const PAGE_SIZE = 15;

const useInvestmentsList = (params = {}, enabled = true) =>
  useInfiniteQuery({
    queryKey: ["crmInvestmentsList", params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await investmentApi.getList({ ...params, page: pageParam, limit: PAGE_SIZE });
      return {
        items: res.data?.data ?? [],
        total: res.data?.pagination?.total ?? 0,
        page: res.data?.pagination?.page ?? pageParam,
        totalPages: res.data?.pagination?.total_pages ?? 1,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled,
  });

export default useInvestmentsList;
