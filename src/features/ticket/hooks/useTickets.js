import { useMemo } from "react";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import ticketApi from "../api/ticketApi";

const PAGE_SIZE = 20;

const useTickets = (params) => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  const query = useInfiniteQuery({
    queryKey: ["tickets", params],
    queryFn: async ({ pageParam }) => {
      const res = await ticketApi.getTickets({ ...params, page: pageParam, limit: PAGE_SIZE });
      return { items: res.data?.data ?? [], total: res.data?.total ?? 0 };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return lastPage.items.length > 0 && loaded < lastPage.total ? allPages.length + 1 : undefined;
    },
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
    // capabilities/version đổi liên tục khi nhiều người cùng xử lý — dữ liệu cũ dễ thao tác ra 409
    staleTime: 15_000,
  });

  // Giữ nguyên mảng giữa các lần render để FlatList / TicketCard (memo) không render lại khi dữ liệu không đổi
  const tickets = useMemo(() => query.data?.pages?.flatMap((page) => page.items) ?? [], [query.data]);
  const total = query.data?.pages?.[0]?.total ?? 0;

  return { ...query, tickets, total };
};

export default useTickets;
