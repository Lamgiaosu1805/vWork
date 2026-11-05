import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const AVATAR_COLORS = ["#0052FF", "#059669", "#7C3AED", "#D97706", "#DB2777", "#0891B2", "#374151"];

export const initialsOf = (name = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[words.length - 2][0]}${words[words.length - 1][0]}`.toUpperCase();
};

export const avatarColorOf = (key = "") => {
  const text = String(key);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const formatDate = (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "");
export const formatShortDate = (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "");
export const formatDateTime = (value) => (value ? dayjs(value).format("DD/MM/YYYY · HH:mm") : "");
export const formatLongDate = (value) => {
  if (!value) return "";
  const text = dayjs(value).format("dddd, DD/MM/YYYY");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// "5 phút" / "3 giờ" / "2 ngày" — thời gian từ lần cập nhật gần nhất, hiện ở góc thẻ ticket
export const formatAgo = (value) => {
  if (!value) return "";
  const minutes = Math.max(0, dayjs().diff(dayjs(value), "minute"));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày`;
  return formatShortDate(value);
};

export const formatMessageTime = (value) => {
  if (!value) return "";
  const date = dayjs(value);
  if (date.isSame(dayjs(), "day")) return date.format("HH:mm");
  if (date.isSame(dayjs().subtract(1, "day"), "day")) return `Hôm qua ${date.format("HH:mm")}`;
  return date.format("DD/MM/YYYY HH:mm");
};

// Tên file từ URI / server có thể bị URL-encode; chuỗi có "%" lẻ thì decodeURIComponent ném URIError → giữ nguyên
export const safeDecode = (value = "") => {
  try {
    return decodeURIComponent(String(value ?? ""));
  } catch {
    return String(value ?? "");
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
};

export const formatPhone = (phone = "") => {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
};

export const formatMoney = (value) =>
  value === "" || value === null || value === undefined || Number.isNaN(Number(value))
    ? String(value ?? "")
    : Number(value).toLocaleString("vi-VN");

// Ngày người dùng chọn → ISO theo giờ VN, để backend hiểu đúng ngày (không lệch sang hôm trước do UTC)
export const toIsoDate = (date) => (date ? `${dayjs(date).format("YYYY-MM-DD")}T00:00:00+07:00` : null);

// Thời hạn theo ngày làm việc (meta.policy.workdayMinutes) — "2 ngày 3 giờ"
export const formatWorkingDuration = (minutes, workdayMinutes) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const workday = Number(workdayMinutes) || 0;
  const days = workday > 0 ? Math.floor(total / workday) : 0;
  const rest = total - days * workday;
  const parts = [];
  if (days) parts.push(`${days} ngày`);
  if (Math.floor(rest / 60)) parts.push(`${Math.floor(rest / 60)} giờ`);
  if (rest % 60) parts.push(`${rest % 60} phút`);
  return parts.join(" ") || "0 phút";
};

export const urgencyHint = (description, urgency, policy) => {
  const minutes = policy?.unclaimedMinutes?.[urgency];
  if (!minutes || !policy?.workdayMinutes) return description;
  const duration = formatWorkingDuration(minutes, policy.workdayMinutes);
  return `${description} Cần được tiếp nhận trong ${duration} làm việc.`.trim();
};

const normalizeAppCode = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

// Trường mẫu gắn appCodes chỉ hiện với sản phẩm có app tương ứng; appCodes rỗng = hiện với mọi sản phẩm
export const fieldsForApp = (fields = [], appCode) => {
  const target = normalizeAppCode(appCode);
  return fields.filter(
    (field) =>
      !field.appCodes?.length || field.appCodes.some((code) => normalizeAppCode(code) === target),
  );
};

// Tiêu đề gợi ý từ mẫu: thay {product}, {phone}, {name} và key các trường chi tiết; token trống bị bỏ
export const buildTitleFromPattern = (pattern, { productName, customer, customFields }) => {
  if (!pattern) return "";
  const values = {
    product: productName ?? "",
    phone: customer?.phone ?? "",
    name: customer?.name ?? "",
    ...(customFields ?? {}),
  };
  return pattern
    .replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? "").trim())
    .replace(/\s*[–-]\s*$/, "")
    .replace(/\[\s*\]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

// "Người tạo không bổ sung" chỉ do hệ thống đặt; ticket cần tờ trình chưa hợp lệ thì chưa được "Đã giải quyết"
export const resolutionOptionsOf = (ticket, meta) => {
  const solvedBlocked = Boolean(ticket?.approval?.required && ticket.approval.status !== "verified");
  return (meta?.resolutions ?? []).filter(
    (item) => item.code !== "requester_no_response" && !(solvedBlocked && item.code === "solved"),
  );
};

// Khớp availableActionKeys của web: capabilities (server) VÀ quyền thô của route tương ứng — thiếu quyền route thì
// bấm xong chỉ nhận 403. Nhận / trả lại chỉ cho ticket.handle; việc của nhóm xử lý thì handle hoặc manage ("đóng
// hộ"); việc của người tạo cần ticket.create. Ticket cần tờ trình chưa hợp lệ thì chưa báo xong được.
const NEEDS_HANDLE_ONLY = ["claim", "release"];
const NEEDS_HANDLE_OR_MANAGE = [
  "resume",
  "resolve",
  "hold",
  "requestInfo",
  "close",
  "setDueHint",
  "manageCollaborators",
  "linkRelated",
];
const NEEDS_CREATE = ["confirm", "cancel", "submitInfo"];

export const allowedCapabilitiesOf = (ticket, canAny) => {
  const caps = ticket?.capabilities ?? {};
  const canHandle = canAny(["ticket.handle"]);
  const canHandleOrManage = canAny(["ticket.handle", "ticket.manage"]);
  const canCreate = canAny(["ticket.create"]);
  const approvalPending = Boolean(ticket?.approval?.required && ticket.approval.status !== "verified");

  return Object.fromEntries(
    Object.entries(caps).map(([key, value]) => {
      if (!value) return [key, false];
      if (NEEDS_HANDLE_ONLY.includes(key) && !canHandle) return [key, false];
      if (NEEDS_HANDLE_OR_MANAGE.includes(key) && !canHandleOrManage) return [key, false];
      if (NEEDS_CREATE.includes(key) && !canCreate) return [key, false];
      if (key === "resolve" && approvalPending) return [key, false];
      return [key, true];
    }),
  );
};

export const isTicketFinished = (ticket) =>
  ticket?.status === "closed" || ticket?.status === "cancelled";

export const errorMessageOf = (error, fallback = "Có lỗi xảy ra, vui lòng thử lại") => {
  if (error?.response?.status === 409) {
    return "Ticket vừa được người khác cập nhật. Đã tải lại, vui lòng thử lại.";
  }
  return error?.response?.data?.message || fallback;
};
