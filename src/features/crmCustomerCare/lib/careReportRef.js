// Cầu nối mở form báo cáo chăm sóc từ bất kỳ đâu trong khu CRM (giống omicallDialRef) —
// CustomerCareReportHost (mount ở crm/_layout.js) đăng ký handler thật.
let openHandler = null;

export function registerOpenCareReport(handler) {
  openHandler = handler;
}

/**
 * payload: { customer: { _id, external_id, phone_number, identity? }, callLogId?, source?: "manual" | "call" | "socket" }
 */
export function openCareReport(payload) {
  if (openHandler) return openHandler(payload);
  console.log("[CustomerCare] Form báo cáo chưa sẵn sàng");
  return false;
}
