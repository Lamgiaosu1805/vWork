import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { startCall, OmiCallState } from "omikit-plugin";
import { showCallError } from "../../../helpers/omicallHelper";
import { DialCallModal } from "../../crm/components/omicall/DialCallModal";
import { ConfirmCallModal, useRecordCallAttempt } from "../../crmCustomerCall";
import { openCareReport } from "../lib/careReportRef";

/**
 * Luồng gọi OMICall từ hàng đợi chăm sóc — giống CustomerCallListTab (xác nhận → startCall →
 * DialCallModal); khi cúp máy tự mở form báo cáo chăm sóc. call_log_id được gắn sau khi socket
 * customer_call:ended tới (CustomerCareReportHost).
 */
const CareCallController = forwardRef((_props, ref) => {
  const [customerToCall, setCustomerToCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const recordCallAttemptMutation = useRecordCallAttempt();
  const callingRef = useRef(false);
  // DialCallModal có thể gọi onClose 2 lần (sự kiện ngắt máy + timeout nút Kết thúc) bằng closure cũ
  const activeCallRef = useRef(null);

  useImperativeHandle(ref, () => ({
    call: (customer) => {
      if (!customer?.phone_number) {
        Toast.show({ type: "error", text1: "Khách hàng chưa có số điện thoại" });
        return;
      }
      setCustomerToCall(customer);
    },
  }));

  const handleConfirmCall = async () => {
    const customer = customerToCall;
    setCustomerToCall(null);
    if (!customer || callingRef.current) return;
    callingRef.current = true;
    try {
      const rawResult = await startCall({ phoneNumber: customer.phone_number, isVideo: false });
      const result = typeof rawResult === "string" ? JSON.parse(rawResult) : rawResult;
      if (result.status === 8 || result.status === 407) {
        if (customer._id) recordCallAttemptMutation.mutate(customer._id);
        activeCallRef.current = customer;
        setActiveCall(customer);
      } else {
        showCallError(result.status, result.message_detail || result.message);
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Không thể gọi", text2: err?.message || "Lỗi không xác định" });
    } finally {
      callingRef.current = false;
    }
  };

  const handleCallClosed = () => {
    const customer = activeCallRef.current;
    activeCallRef.current = null;
    setActiveCall(null);
    if (customer) openCareReport({ customer, source: "call" });
  };

  return (
    <>
      <ConfirmCallModal customer={customerToCall} onClose={() => setCustomerToCall(null)} onConfirm={handleConfirmCall} />
      <DialCallModal
        visible={!!activeCall}
        status={OmiCallState.calling}
        callerNumber={activeCall?.phone_number}
        onClose={handleCallClosed}
      />
    </>
  );
});

CareCallController.displayName = "CareCallController";

export default CareCallController;
