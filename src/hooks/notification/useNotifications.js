import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from "../../api/notificationApi";

export const NOTIFICATIONS_KEY = ["notifications"];
export const UNREAD_COUNT_KEY = ["notifications-unread"];

const PAGE_LIMIT = 20;

export function useNotificationsInfinite() {
  return useInfiniteQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getNotificationsApi(pageParam, PAGE_LIMIT);
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.hasMore ? allPages.length + 1 : undefined,
  });
}

export function useUnreadCount() {
  const { data } = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: async () => {
      const res = await getUnreadCountApi();
      return res.data;
    },
    staleTime: 30_000,
    select: (data) => data?.count ?? 0,
  });

  return data ?? 0;
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => markNotificationReadApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });
}
