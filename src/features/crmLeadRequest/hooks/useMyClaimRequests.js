import { useInfiniteQuery } from "@tanstack/react-query";
import claimRequestApi from "../api/claimRequestApi";

const PAGE_SIZE = 15;

const useMyClaimRequests = () =>
  useInfiniteQuery({
    queryKey: ["crmMyClaimRequests"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await claimRequestApi.getMine({ page: pageParam, limit: PAGE_SIZE });
      return {
        items: res.data?.data ?? [],
        page: pageParam,
        totalPages: res.data?.pagination?.total_pages ?? 1,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

export default useMyClaimRequests;
