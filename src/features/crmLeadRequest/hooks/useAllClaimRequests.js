import { useInfiniteQuery } from "@tanstack/react-query";
import claimRequestApi from "../api/claimRequestApi";

const PAGE_SIZE = 15;

const useAllClaimRequests = (status) =>
  useInfiniteQuery({
    queryKey: ["crmAllClaimRequests", status],
    queryFn: async ({ pageParam = 1 }) => {
      const params = { page: pageParam, limit: PAGE_SIZE };
      if (status && status !== "all") params.status = status;
      const res = await claimRequestApi.getAll(params);
      return {
        items: res.data?.data ?? [],
        page: pageParam,
        totalPages: res.data?.pagination?.total_pages ?? 1,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

export default useAllClaimRequests;
