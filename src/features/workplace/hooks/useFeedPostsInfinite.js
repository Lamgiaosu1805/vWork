import { useInfiniteQuery } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const PAGE_SIZE = 10;

const useFeedPostsInfinite = (params = {}, options = {}) =>
  useInfiniteQuery({
    queryKey: ["posts", params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await feedApi.getPosts({ ...params, page: pageParam, limit: PAGE_SIZE });
      const items = res?.data?.data ?? res?.data ?? [];
      const pagination = res?.data?.pagination ?? {};
      const totalPages = pagination.total_pages ?? Math.ceil((pagination.total ?? items.length) / PAGE_SIZE);
      return { items, page: pageParam, totalPages };
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: options.enabled ?? true,
  });

export default useFeedPostsInfinite;
