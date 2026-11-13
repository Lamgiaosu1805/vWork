import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const toMs = (value) => (value ? new Date(value).getTime() : null);

const pad = (n) => String(n).padStart(2, "0");

/** Thời lượng còn lại: < 1 giờ → "mm:ss", từ 1 giờ → "X giờ YY phút", từ 1 ngày → "X ngày Y giờ". */
export const formatDuration = (ms) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (days > 0) return `${days} ngày ${hours} giờ`;
  if (hours > 0) return `${hours} giờ ${pad(minutes)} phút`;
  return `${pad(minutes)}:${pad(seconds)}`;
};

/** "HH:mm" nếu cùng ngày với now, ngược lại "HH:mm DD/MM". */
export const formatMoment = (value, now) => {
  if (!value) return "";
  const d = dayjs(value);
  return d.isSame(dayjs(now), "day") ? d.format("HH:mm") : d.format("HH:mm DD/MM");
};

export const isFirstContactPending = (item) => !item?.first_contact_at;

/**
 * Trạng thái hiển thị của 1 lượt giao tại thời điểm `now` (đã lệch theo server_time). Tự tính lại ở
 * client để đồng hồ chạy realtime giữa 2 lần refetch, thay vì chỉ tin `sla_state` lúc tải.
 */
export const getSlaView = (item, now) => {
  const firstDue = toMs(item.first_contact_due_at);
  const revokeAt = toMs(item.revoke_at);
  const inactivityDue = toMs(item.inactivity_due_at);
  const appointmentAt = toMs(item.appointment_at);
  const autoRevoke = !!item.auto_revoke;

  if (isFirstContactPending(item)) {
    const overdue = firstDue !== null && now >= firstDue;
    return {
      bucket: overdue ? 0 : 1,
      deadline: firstDue ?? Number.MAX_SAFE_INTEGER,
      tone: overdue ? "danger" : firstDue !== null && firstDue - now <= 2 * 60 * 1000 ? "warning" : "info",
      headline: overdue
        ? "Quá hạn liên hệ"
        : firstDue !== null
          ? `Còn ${formatDuration(firstDue - now)} để gọi lần đầu`
          : "Chưa liên hệ",
      subline: overdue && firstDue !== null ? `Quá ${formatDuration(now - firstDue)}` : null,
      revokeText:
        autoRevoke && revokeAt
          ? now >= revokeAt
            ? "Đang chờ hệ thống thu hồi"
            : `Sẽ bị thu hồi lúc ${formatMoment(revokeAt, now)}`
          : !autoRevoke
            ? "Không tự thu hồi (khách giới thiệu)"
            : null,
    };
  }

  const careOverdue = inactivityDue !== null && now >= inactivityDue;
  const hasAppointment = appointmentAt !== null && appointmentAt > now;
  const deadline = Math.min(
    inactivityDue ?? Number.MAX_SAFE_INTEGER,
    hasAppointment ? appointmentAt : Number.MAX_SAFE_INTEGER,
  );
  return {
    bucket: careOverdue ? 2 : item.sla_state === "warning" ? 3 : 4,
    deadline,
    tone: careOverdue ? "danger" : item.sla_state === "warning" ? "warning" : "success",
    headline: careOverdue
      ? "Quá hạn chăm sóc"
      : inactivityDue !== null
        ? `Hạn chăm sóc tiếp theo: ${formatMoment(inactivityDue, now)}`
        : "Đang chăm sóc",
    subline:
      !careOverdue && inactivityDue !== null ? `Còn ${formatDuration(inactivityDue - now)}` : null,
    revokeText: careOverdue && autoRevoke ? "Có thể bị thu hồi nếu không báo cáo chăm sóc" : null,
  };
};

export const sortQueueByUrgency = (items, now) =>
  [...items]
    .map((item) => ({ item, view: getSlaView(item, now) }))
    .sort((a, b) => a.view.bucket - b.view.bucket || a.view.deadline - b.view.deadline)
    .map(({ item }) => item);

/** Số khách cần Sale xử lý ngay (chưa liên hệ hoặc đã quá hạn chăm sóc / bị cảnh báo) — dùng cho badge. */
export const countNeedsAction = (items = []) =>
  items.filter((i) => isFirstContactPending(i) || i.sla_state === "inactive_due" || i.sla_state === "warning")
    .length;

export const customerNameOf = (customer) =>
  customer?.identity?.full_name || customer?.full_name || customer?.phone_number || "Khách hàng";
