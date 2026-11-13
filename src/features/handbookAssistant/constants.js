// Trợ lý Nội quy (VINNY) — dùng chung hợp đồng với web (vWork-website/src/features/ai-assistant/constants.js).

export const HANDBOOK_ASSISTANT_PERMISSION = "handbook_assistant.use";

export const ASSISTANT_TITLE = "VINNY - Trợ lý Nội quy";
export const ASSISTANT_SUBTITLE = "Hỏi đáp nội quy & chính sách nhân sự";

export const DISCLAIMER =
  "Thông tin tham khảo, vui lòng xác nhận với Phòng Hành chính - Nhân sự";

export const QUESTION_MAX_LENGTH = 1000;
export const SUGGESTION_COUNT = 3;

export const SOCKET_EVENTS = {
  ASK: "handbook:ask",
  CANCEL: "handbook:cancel",
  START: "handbook:start",
  DELTA: "handbook:delta",
  DONE: "handbook:done",
  ERROR: "handbook:error",
};

export const QUERY_KEYS = {
  all: ["handbook-assistant"],
  conversations: ["handbook-assistant", "conversations"],
  messages: (conversationId) => ["handbook-assistant", "messages", conversationId],
  quota: ["handbook-assistant", "quota"],
  suggestions: ["handbook-assistant", "suggestions"],
  article: (documentCode, idx) => ["handbook-assistant", "article", documentCode, idx],
};

// Gom delta trong khoảng này rồi mới dispatch để không render lại theo từng token.
export const DELTA_FLUSH_MS = 50;
export const ASK_ACK_TIMEOUT_MS = 15_000;
// Không nhận được sự kiện nào của câu trả lời đang chạy trong khoảng này thì coi như mất kết nối.
// Khác web: mất socket không báo lỗi ngay (app hay bị ngắt khi ra nền) — chờ nối lại rồi đồng bộ.
export const STREAM_IDLE_TIMEOUT_MS = 90_000;
// Server không phản hồi lệnh dừng thì tự kết thúc ở app để nút Dừng không treo.
export const CANCEL_FALLBACK_MS = 5_000;

// Đổi khi nội dung màn đồng ý thay đổi → mọi người phải đồng ý lại.
export const CONSENT_VERSION = 1;

// action: "new_conversation" → gợi ý mở hội thoại mới; "retry" → cho hỏi lại câu vừa hỏi.
export const ERROR_INFO = {
  QUOTA_EXCEEDED: {
    severity: "warning",
    title: "Bạn đã hết lượt hỏi hôm nay",
    message: "Hạn mức câu hỏi sẽ được làm mới vào ngày mai.",
  },
  BUSY: {
    severity: "warning",
    title: "Trợ lý đang bận",
    message:
      "Đang có câu hỏi khác của bạn được xử lý (có thể trên máy tính) hoặc hệ thống quá tải. Vui lòng thử lại sau ít phút.",
    action: "retry",
  },
  CONVERSATION_LOCKED: {
    severity: "info",
    title: "Hội thoại này không thể tiếp tục",
    message:
      "Văn bản nội quy đã được cập nhật nên hội thoại cũ bị khoá. Hãy bắt đầu hội thoại mới.",
    action: "new_conversation",
  },
  TURN_LIMIT: {
    severity: "info",
    title: "Hội thoại đã quá dài",
    message:
      "Hội thoại đã đạt số lượt hỏi tối đa. Hãy bắt đầu hội thoại mới để tiếp tục.",
    action: "new_conversation",
  },
  AI_UNAVAILABLE: {
    severity: "error",
    title: "Trợ lý tạm thời không khả dụng",
    message: "Không kết nối được dịch vụ AI. Vui lòng thử lại sau.",
    action: "retry",
  },
  REFUSED: {
    severity: "info",
    title: "Câu hỏi nằm ngoài phạm vi",
    message:
      "Trợ lý chỉ trả lời các câu hỏi về nội quy, quy định và chính sách nhân sự của công ty.",
  },
  CANCELLED: {
    severity: "info",
    title: "Đã dừng trả lời",
  },
  NO_ACTIVE_HANDBOOK: {
    severity: "warning",
    title: "Chưa có văn bản nội quy hiệu lực",
    message:
      "Phòng Hành chính - Nhân sự chưa công bố văn bản nội quy. Vui lòng quay lại sau.",
  },
  FORBIDDEN: {
    severity: "warning",
    title: "Bạn chưa được cấp quyền dùng trợ lý",
    message: "Vui lòng liên hệ Phòng Hành chính - Nhân sự.",
  },
  // Mã phía app: không nhận được ack hoặc mất kết nối quá lâu giữa chừng.
  NETWORK: {
    severity: "error",
    title: "Mất kết nối tới máy chủ",
    message: "Vui lòng kiểm tra mạng và thử lại.",
    action: "retry",
  },
  UNKNOWN: {
    severity: "error",
    title: "Đã có lỗi xảy ra",
    message: "Vui lòng thử lại sau.",
    action: "retry",
  },
};

export const getErrorInfo = (code) => ERROR_INFO[code] ?? ERROR_INFO.UNKNOWN;

export const TRUNCATED_NOTICE =
  "Câu trả lời đã bị cắt bớt vì quá dài. Hãy hỏi cụ thể hơn để nhận câu trả lời đầy đủ.";
