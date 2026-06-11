export const DAYS_LABEL = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export const STATUS_MAP = {
  pending: { label: "Chờ duyệt", bg: "#FEF3C7", color: "#D97706" },
  approved: { label: "Đã duyệt", bg: "#DCFCE7", color: "#15803D" },
  rejected: { label: "Từ chối", bg: "#FEE2E2", color: "#DC2626" },
  cancelled: { label: "Đã thu hồi", bg: "#E5E7EB", color: "#4B5563" },
};

export const SHIFT_LABEL = {
  full: "Cả ngày",
  morning: "Ca sáng",
  afternoon: "Ca chiều",
};

export const REQUEST_TYPE_ITEMS = [
  {
    label: "Quên chấm công",
    value: "forgot_checkin",
    request_type: "forgot_checkin",
  },
  {
    label: "Nghỉ phép",
    value: "leave_paid",
    request_type: "leave",
    leave_type: "paid",
  },
  {
    label: "Nghỉ không phép",
    value: "leave_unpaid",
    request_type: "leave",
    leave_type: "unpaid",
  },
  {
    label: "Nghỉ dài hạn",
    value: "leave_long",
    request_type: "leave",
    is_long_leave: true,
  },
  {
    label: "Đi muộn",
    value: "late",
    request_type: "late_early",
    type: "late",
    shift: "full",
  },
  {
    label: "Về sớm",
    value: "early_out",
    request_type: "late_early",
    type: "early_out",
    shift: "full",
  },
];

export const PERIOD_ITEMS = [
  { label: "Buổi sáng (08:00 - 12:00)", value: "morning" },
  { label: "Buổi chiều (13:00 - 17:00)", value: "afternoon" },
];

export const SESSION_ITEMS = [
  { label: "Cả ngày (08:00 - 17:00)", value: "full" },
  { label: "Buổi sáng (08:00 - 12:00)", value: "morning" },
  { label: "Buổi chiều (13:00 - 17:00)", value: "afternoon" },
];

export const FORGOT_TYPE_ITEMS = [
  { label: "Quên check-in", value: "check_in" },
  { label: "Quên check-out", value: "check_out" },
];

export const TABS = [
  { key: "", label: "Tất cả", dot: "#64748B" },
  { key: "pending", label: "Chờ Duyệt", dot: "#F59E0B" },
  { key: "approved", label: "Đã Duyệt", dot: "#22C55E" },
  { key: "rejected", label: "Từ Chối", dot: "#EF4444" },
];

export const FILTER_ITEMS = [
  { label: "Tất cả loại", value: "" },
  { label: "Nghỉ phép", value: "leave" },
  { label: "Quên chấm công", value: "forgot_checkin" },
  { label: "Đi muộn / Về sớm", value: "late_early" },
];

export const PERIOD_LABEL = { morning: "Buổi sáng", afternoon: "Buổi chiều" };
