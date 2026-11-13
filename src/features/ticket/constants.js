// Nhãn/màu khớp vWork-website features/ticket/constants/ticket.constants.js — logic quyền/trạng thái nằm ở
// backend (ticket.capabilities), app chỉ hiển thị.

export const TICKET_PRIMARY = "#FF5722";

export const TICKET_TABS = [
  {
    value: "my",
    title: "Của tôi",
    chips: [
      { label: "Tất cả", scope: "all" },
      { label: "Đang mở", scope: "open" },
      { label: "Tôi tạo", scope: "created" },
      { label: "Tôi đang xử lý", scope: "handling" },
      { label: "Giao cho tôi", scope: "assigned" },
    ],
  },
  {
    value: "needs_reply",
    title: "Cần tôi phản hồi",
  },
  {
    value: "yellow",
    title: "Cần chú ý",
  },
  {
    value: "unclaimed",
    title: "Chưa ai nhận",
  },
  {
    value: "department",
    title: "Ticket phòng ban",
    chips: [
      { label: "Tất cả của phòng", scope: "all" },
      { label: "Giao cho phòng, chờ nhận", scope: "waiting" },
      { label: "Phòng đang xử lý", scope: "handling" },
      { label: "Do phòng tạo", scope: "created" },
    ],
  },
  {
    value: "all",
    title: "Tất cả",
  },
];

export const TICKET_DEFAULT_TAB = "my";

export const TICKET_EMPTY_STATES = {
  my: {
    title: "Bạn chưa có ticket nào",
    description: "Ticket bạn tạo, bạn xử lý hoặc được giao riêng cho bạn sẽ hiện ở đây.",
  },
  needs_reply: {
    title: "Không có ticket nào đang chờ bạn phản hồi",
    description: "Ticket bạn tạo cần bổ sung thông tin hoặc cần xác nhận đã xong sẽ hiện ở đây.",
  },
  unclaimed: {
    title: "Không có ticket nào chưa ai nhận",
    description: "Ticket chưa giao cho ai — cả công ty đều nhận được.",
  },
  department: {
    title: "Chưa có ticket nào của phòng bạn",
    description: "Ticket giao cho phòng, phòng đang xử lý hoặc do phòng tạo sẽ hiện ở đây.",
  },
  yellow: {
    title: "Không có ticket nào cần chú ý",
    description: "Ticket chưa ai nhận quá lâu, im lặng, quá ngày hẹn hoặc tạm hoãn lâu sẽ hiện ở đây.",
  },
  all: {
    title: "Không có ticket nào",
    description: "Thử đổi bộ lọc hoặc từ khoá tìm kiếm.",
  },
};

export const TICKET_STATUS_CONFIG = {
  open: { label: "Mới", bg: "#E0F2FE", color: "#0369A1" },
  in_progress: { label: "Đang xử lý", bg: "#DBEAFE", color: "#1D4ED8" },
  waiting_info: { label: "Chờ bổ sung", bg: "#FEF3C7", color: "#B45309" },
  on_hold: { label: "Tạm hoãn", bg: "#EDE9FE", color: "#6D28D9" },
  resolved: { label: "Đã xử lý", bg: "#DCFCE7", color: "#15803D" },
  closed: { label: "Đã đóng", bg: "#E5E7EB", color: "#4B5563" },
  cancelled: { label: "Đã huỷ", bg: "#E5E7EB", color: "#6B7280" },
};

export const TICKET_URGENCY_CONFIG = {
  urgent: {
    label: "Khẩn",
    bg: "#FEE2E2",
    color: "#B91C1C",
    description: "Nhiều khách bị ảnh hưởng hoặc tiền khách có rủi ro.",
  },
  high: {
    label: "Cao",
    bg: "#FFEDD5",
    color: "#C2410C",
    description: "Một khách bị chặn hoặc giao dịch treo.",
  },
  normal: { label: "Bình thường", bg: "#F3F4F6", color: "#4B5563", description: "Việc thông thường." },
  low: { label: "Thấp", bg: "#F0FDF4", color: "#15803D", description: "Không gấp: đề xuất, câu hỏi." },
};

export const TICKET_URGENCIES = ["urgent", "high", "normal", "low"];

export const TICKET_YELLOW_REASON_LABELS = {
  unclaimed: "Lâu chưa có ai nhận",
  silent: "Lâu chưa có cập nhật",
  overdue: "Đã quá ngày dự kiến",
  hold_unknown: "Tạm hoãn lâu chưa cập nhật",
};

export const TICKET_YELLOW_COLORS = { bg: "#FEF9C3", border: "#FACC15", color: "#854D0E" };

export const TICKET_APPROVAL_STATUS_CONFIG = {
  missing: { label: "Chưa có tờ trình", bg: "#FEF3C7", color: "#B45309" },
  submitted: { label: "Đã nộp, chờ xác nhận", bg: "#DBEAFE", color: "#1D4ED8" },
  verified: { label: "Tờ trình hợp lệ", bg: "#DCFCE7", color: "#15803D" },
  invalid: { label: "Tờ trình không hợp lệ", bg: "#FEE2E2", color: "#B91C1C" },
};

export const TICKET_ASSIGNMENT_MODE_LABELS = {
  none: "Chưa giao",
  department: "Phòng ban",
  members: "Người cụ thể",
};

export const TICKET_ACTIVITY_LABELS = {
  created: "Tạo ticket",
  claimed: "Nhận xử lý",
  released: "Trả lại ticket",
  assigned: "Giao việc",
  collaborator_added: "Thêm người phối hợp",
  collaborator_removed: "Bỏ người phối hợp",
  info_requested: "Yêu cầu bổ sung",
  info_submitted: "Gửi bổ sung",
  approval_verified: "Xác nhận tờ trình hợp lệ",
  approval_invalid: "Tờ trình không hợp lệ",
  on_hold: "Tạm hoãn",
  resumed: "Tiếp tục xử lý",
  resolved: "Báo đã xử lý xong",
  closed: "Đóng ticket",
  confirmed: "Người tạo xác nhận hoàn tất",
  auto_closed: "Hệ thống tự đóng",
  reopened: "Mở lại ticket",
  cancelled: "Huỷ ticket",
  edited: "Sửa thông tin",
  due_hint_set: "Đổi ngày dự kiến",
  linked: "Liên kết ticket liên quan",
  message: "Nhóm xử lý trả lời",
};

// Tên trường khi hiện lịch sử sửa (changes[].field)
export const TICKET_FIELD_LABELS = {
  title: "Tiêu đề",
  description: "Mô tả",
  productId: "Sản phẩm",
  categoryId: "Loại yêu cầu",
  urgency: "Mức khẩn",
  customer: "Thông tin khách",
  customFields: "Thông tin chi tiết",
  dueHintAt: "Ngày dự kiến",
};

// Loại giấy tờ gán cho file đính kèm (payload.fileKinds) — tờ trình luôn dùng đúng mã approval_document
export const APPROVAL_DOCUMENT_KIND = "approval_document";
export const TICKET_MEDIA_KIND = "screenshot";
export const TICKET_SENSITIVE_DEFAULT_KIND = "sensitive_other";

export const TICKET_FILE_KIND_LABELS = {
  screenshot: "Ảnh / video lỗi",
  cccd_images: "CCCD 2 mặt",
  transaction_proof: "Chứng từ giao dịch",
  approval_document: "Tờ trình có chữ ký",
  sensitive_other: "Giấy tờ nhạy cảm",
  other: "Tài liệu khác",
};

export const TICKET_MAX_FILES = 10;
export const TICKET_MAX_FILE_MB = 25;
export const TICKET_ALLOWED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "txt",
  "mp4",
  "mov",
];
