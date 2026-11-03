export const PRIORITY_META = {
  A: { label: "Khách nóng", short: "A", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
  B: { label: "Nhóm B", short: "B", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  C: { label: "Nhóm C", short: "C", color: "#6B7280", bg: "#F3F4F6", border: "#E5E7EB" },
};

export const CHANNEL_LABELS = {
  auto: "Phân tự động",
  manual: "Quản lý giao",
  referral: "Khách giới thiệu",
  claim: "Yêu cầu nhận khách",
};

export const CUSTOMER_STATUS_LABELS = {
  registered: "Mới đăng ký",
  kyc_verified: "Đã eKYC",
};

export const INTERACTION_TYPE_OPTIONS = [
  { value: "call", label: "Gọi điện" },
  { value: "message", label: "Nhắn tin" },
  { value: "meeting", label: "Gặp mặt" },
];

export const CONTACT_RESULT_OPTIONS = [
  { value: "connected", label: "Nghe máy" },
  { value: "no_answer", label: "Không nghe máy" },
  { value: "busy", label: "Máy bận" },
  { value: "wrong_number", label: "Sai số" },
  { value: "callback_requested", label: "Hẹn gọi lại" },
  { value: "message_replied", label: "Đã phản hồi tin nhắn" },
];

export const RESULT_OPTIONS = [
  { value: "interested", label: "Quan tâm" },
  { value: "not_interested", label: "Không quan tâm" },
  { value: "need_more_info", label: "Cần thêm thông tin" },
  { value: "will_invest", label: "Sẽ đầu tư" },
  { value: "invested", label: "Đã đầu tư" },
  { value: "no_answer", label: "Chưa liên hệ được" },
];

export const LOST_REASON_OPTIONS = [
  { value: "no_need", label: "Không có nhu cầu" },
  { value: "not_eligible", label: "Không đủ điều kiện" },
  { value: "product_mismatch", label: "Sản phẩm không phù hợp" },
  { value: "competitor", label: "Dùng sản phẩm khác" },
  { value: "unreachable", label: "Không liên lạc được" },
  { value: "wrong_contact", label: "Sai thông tin liên hệ" },
  { value: "other", label: "Khác" },
];

export const SYSTEM_INTERACTION_LABELS = {
  note: "Ghi chú",
  email: "Email",
  kyc_updated: "Cập nhật eKYC",
  status_changed: "Đổi trạng thái",
  reassigned: "Giao / thu hồi khách",
};

export const ENDED_REASON_LABELS = {
  revoked_no_contact: "Thu hồi: không liên hệ đúng hạn",
  revoked_inactive: "Thu hồi: không chăm sóc hợp lệ",
  revoked_manual: "Quản lý thu hồi",
  sale_offboarded: "Sale nghỉ việc / bị khoá",
  reassigned: "Chuyển Sale khác",
  claimed: "Yêu cầu nhận khách được duyệt",
  converted: "Khách đã đầu tư",
};

export const POOL_STATUS_LABELS = {
  in_pool: "Trong kho chung",
  assigned: "Đang giao Sale",
  nurturing: "CSKH nuôi dưỡng",
  converted: "Đã chuyển đổi",
  excluded: "Đã loại khỏi kho",
};

export const RECEIVING_STATE_META = {
  receiving: { label: "Đang nhận", color: "#047857", bg: "#ECFDF5" },
  full: { label: "Đủ hạn mức", color: "#B45309", bg: "#FFFBEB" },
  paused: { label: "Tạm dừng", color: "#B45309", bg: "#FEF3C7" },
  locked: { label: "Đã khoá", color: "#B91C1C", bg: "#FEF2F2" },
  on_leave: { label: "Nghỉ phép", color: "#4B5563", bg: "#F3F4F6" },
  resigned: { label: "Đã nghỉ việc", color: "#4B5563", bg: "#F3F4F6" },
};

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? value ?? "";
