import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeChatSocketEvent } from "../../../libs/chatSocket";
import { registerOpenCareReport } from "../lib/careReportRef";
import { CARE_QUERY_KEYS } from "../lib/queryKeys";
import { fetchMyCareQueue } from "../hooks/useMyCareQueue";
import useCustomerCarePermissions from "../hooks/useCustomerCarePermissions";
import CareReportSheet from "./CareReportSheet";

// Sau khi Sale đóng/gửi form của 1 khách, bỏ qua event cuộc gọi tới trễ của chính khách đó trong khoảng này
// (webhook OMICall thường tới sau khi app đã tự mở form lúc cúp máy).
const RECENTLY_HANDLED_MS = 3 * 60 * 1000;

/**
 * Mount 1 lần ở crm/_layout.js. Giữ form báo cáo chăm sóc dùng chung cho cả khu CRM và tự mở form sau
 * cuộc gọi tổng đài (socket customer_call:ended) nếu khách đang nằm trong hàng đợi của Sale.
 */
const CustomerCareReportHost = () => {
  const queryClient = useQueryClient();
  const { showCustomerCareQueue } = useCustomerCarePermissions();
  const [target, setTarget] = useState(null);
  const targetRef = useRef(null);
  const handledAtRef = useRef(new Map());
  const canViewQueueRef = useRef(showCustomerCareQueue);
  canViewQueueRef.current = showCustomerCareQueue;

  const setTargetSynced = useCallback((next) => {
    targetRef.current = next;
    setTarget(next);
  }, []);

  const findInQueue = useCallback(
    (customerId) => {
      if (!customerId) return null;
      const data = queryClient.getQueryData(CARE_QUERY_KEYS.myQueue);
      return data?.items?.find((row) => String(row.customer_id?._id) === String(customerId)) ?? null;
    },
    [queryClient],
  );

  const open = useCallback(
    ({ customer, callLogId = null, source = "manual" }) => {
      if (!customer?.external_id) return false;
      const key = String(customer._id ?? customer.external_id);
      const current = targetRef.current;
      const currentKey = current ? String(current.customer._id ?? current.customer.external_id) : null;

      if (current && currentKey === key) {
        if (callLogId && !current.callLogId) setTargetSynced({ ...current, callLogId });
        return true;
      }
      // Đang nhập dở form khách khác → không chen form tự động
      if (current && source !== "manual") return false;

      if (source === "socket") {
        const handledAt = handledAtRef.current.get(key);
        if (handledAt && Date.now() - handledAt < RECENTLY_HANDLED_MS) return false;
      }

      const queueRow = findInQueue(customer._id);
      setTargetSynced({
        customer: queueRow?.customer_id ? { ...customer, ...queueRow.customer_id } : customer,
        callLogId,
        strict: !!queueRow,
      });
      return true;
    },
    [findInQueue, setTargetSynced],
  );

  useEffect(() => {
    registerOpenCareReport(open);
    return () => registerOpenCareReport(null);
  }, [open]);

  useEffect(() => {
    const handleCallEnded = async (payload) => {
      const customerId = payload?.customerId;
      if (!customerId || !canViewQueueRef.current) return;

      let row = findInQueue(customerId);
      if (!row) {
        try {
          const fresh = await queryClient.fetchQuery({
            queryKey: CARE_QUERY_KEYS.myQueue,
            queryFn: fetchMyCareQueue,
            staleTime: 5 * 1000,
          });
          row = fresh?.items?.find((r) => String(r.customer_id?._id) === String(customerId)) ?? null;
        } catch (err) {
          console.log("[CustomerCare] Không tải được hàng đợi:", err?.message);
        }
      }
      // Cuộc gọi đã cập nhật lần liên hệ / số lần gọi của lượt giao
      queryClient.invalidateQueries({ queryKey: CARE_QUERY_KEYS.myQueue });
      if (!row?.customer_id) return;

      open({ customer: row.customer_id, callLogId: payload?.callLogId ?? null, source: "socket" });
    };

    return subscribeChatSocketEvent("customer_call:ended", handleCallEnded);
  }, [findInQueue, open, queryClient]);

  const handleClose = useCallback(() => {
    const current = targetRef.current;
    if (current) {
      handledAtRef.current.set(String(current.customer._id ?? current.customer.external_id), Date.now());
    }
    setTargetSynced(null);
  }, [setTargetSynced]);

  return <CareReportSheet target={target} onClose={handleClose} />;
};

export default CustomerCareReportHost;
