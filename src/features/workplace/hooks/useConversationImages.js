import { useInfiniteQuery } from "@tanstack/react-query";
import chatApi from "../api/chat";

const PAGE_SIZE = 12;

const useConversationImages = (conversationId) =>
  useInfiniteQuery({
    queryKey: ["conversationImages", conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await chatApi.getConversationImages(conversationId, pageParam, PAGE_SIZE);
      const items = res?.data?.data ?? [];
      const pagination = res?.data?.pagination ?? {};
      return { items, page: pageParam, totalPages: pagination.total_pages ?? 1 };
    },
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!conversationId,
  });

export default useConversationImages;
