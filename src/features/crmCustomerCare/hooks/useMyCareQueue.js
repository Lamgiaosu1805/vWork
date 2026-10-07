import { useEffect } from "react";
import { AppState } from "react-native";
import { useQuery } from "@tanstack/react-query";
import customerCareApi from "../api/customerCareApi";
import { CARE_QUERY_KEYS } from "../lib/queryKeys";

const REFETCH_INTERVAL_MS = 30 * 1000;

export const fetchMyCareQueue = async () => {
  const receivedAt = Date.now();
  const res = await customerCareApi.getMyQueue();
  const body = res.data ?? {};
  const serverMs = body.server_time ? new Date(body.server_time).getTime() : NaN;
  return {
    items: body.data ?? [],
    summary: body.summary ?? { total: 0, not_contacted: 0, overdue: 0, appointments_today: 0 },
    // Lệch đồng hồ máy so với server — đếm ngược dùng Date.now() + offset
    serverOffsetMs: Number.isFinite(serverMs) ? serverMs - receivedAt : 0,
  };
};

/** Hàng đợi "Khách cần xử lý" của Sale: tự refetch 30s và khi app trở lại foreground. */
const useMyCareQueue = ({ enabled = true } = {}) => {
  const query = useQuery({
    queryKey: CARE_QUERY_KEYS.myQueue,
    queryFn: fetchMyCareQueue,
    enabled,
    refetchInterval: enabled ? REFETCH_INTERVAL_MS : false,
  });

  const { refetch } = query;
  useEffect(() => {
    if (!enabled) return undefined;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refetch();
    });
    return () => sub.remove();
  }, [enabled, refetch]);

  return query;
};

export default useMyCareQueue;
