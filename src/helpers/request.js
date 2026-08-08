import dayjs from "dayjs";
import { PERIOD_LABEL_SHORT } from "../constants/hrm";

export const getRequestTypeLabel = (item) => {
  if (item.request_type === "leave") {
    return item.leave_type === "paid"
      ? "Nghỉ phép có lương"
      : "Nghỉ phép không lương";
  }
  if (item.request_type === "forgot_checkin") {
    if (item.type === "check_in") return "Quên check-in";
    if (item.type === "check_out") return "Quên check-out";
    return "Quên check-in & check-out";
  }
  if (item.request_type === "late_early") {
    return item.type === "late" ? "Đi muộn" : "Về sớm";
  }
  if (item.request_type === "remote") return "Làm việc từ xa";
  if (item.request_type === "business_trip") return "Đi công tác";
  if (item.request_type === "client_visit") return "Đi gặp gỡ khách hàng";
  return "--";
};

export const getTimeLabel = (item) => {
  if (item.request_type === "leave" || item.request_type === "business_trip") {
    const fromDate = dayjs(item.from_date).format("DD/MM/YYYY");
    const toDate = dayjs(item.to_date).format("DD/MM/YYYY");
    return fromDate === toDate ? fromDate : `${fromDate} · ${toDate}`;
  }

  if (item.request_type === "client_visit") {
    const date = dayjs(item.from_date).format("DD/MM/YYYY");
    return `${date} • ${item.start_time ?? "--"} - ${item.end_time ?? "--"}`;
  }

  if (item.request_type === "remote") {
    return dayjs(item.from_date).format("DD/MM/YYYY");
  }

  if (item.date) return dayjs(item.date).format("DD/MM/YYYY");
  return "--";
};

export const getLeaveTimeLabel = (item) => {
  const fromDate = dayjs(item.from_date).format("DD/MM/YYYY");
  const toDate = dayjs(item.to_date).format("DD/MM/YYYY");
  const fromAbbr = PERIOD_LABEL_SHORT[item.from_period];
  const toAbbr = PERIOD_LABEL_SHORT[item.to_period];
  const fromLabel = fromAbbr ? `${fromDate} (${fromAbbr})` : fromDate;
  const toLabel = toAbbr ? `${toDate} (${toAbbr})` : toDate;

  return fromDate === toDate && fromAbbr === toAbbr
    ? fromLabel
    : `${fromLabel} · ${toLabel}`;
};

export const needsTwoLevelApproval = (item) => {
  if (item.request_type === "leave" && (item.total_days ?? 0) > 2) return true;
  if (item.request_type === "forgot_checkin" && (item.occurrence ?? 0) >= 6) return true;
  return false;
};

const collectIds = (obj) => {
  if (!obj) return [];
  return [obj.user_id, obj._id, obj.id, obj.account_id, obj.account]
    .filter((id) => id !== undefined && id !== null)
    .map(String);
};

export const isAlreadyApprovedByMe = (item, currentUser) => {
  if (item.status !== "pending") return false;
  if (!needsTwoLevelApproval(item)) return false;

  const approvals = item.approvals ?? [];
  if (!approvals.length) return false;

  const myIds = collectIds(currentUser);
  if (!myIds.length) return false;

  return approvals.some((a) => collectIds(a).some((id) => myIds.includes(id)));
};

export const getAmountLabel = (item) => {
  if (["leave", "remote"].includes(item.request_type)) {
    return `${item.total_days ?? 0} ngày`;
  }
  if (item.request_type === "business_trip") {
    return item.destination_location || "--";
  }
  if (item.request_type === "client_visit") {
    return `${item.start_time ?? "--"} - ${item.end_time ?? "--"}`;
  }
  if (item.request_type === "late_early") {
    return `${item.minutes ?? 0} phút`;
  }
  return "--";
};
