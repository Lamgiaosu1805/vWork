import dayjs from "dayjs";
import { PERIOD_LABEL } from "../constants/hrm";

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
  if (item.request_type === "leave") {
    const fromDate = dayjs(item.from_date).format("DD/MM/YYYY");
    const toDate = dayjs(item.to_date).format("DD/MM/YYYY");
    const fromPeriod = PERIOD_LABEL[item.from_period] || "--";
    const toPeriod = PERIOD_LABEL[item.to_period] || "--";
    if (fromDate === toDate) {
      return item.from_period === item.to_period
        ? `${fromPeriod} ngày ${fromDate}`
        : `Cả ngày ${fromDate}`;
    }
    return `${fromPeriod} ${fromDate} → ${toPeriod} ${toDate}`;
  }

  if (item.request_type === "business_trip") {
    const fromDate = dayjs(item.from_date).format("DD/MM/YYYY");
    const toDate = dayjs(item.to_date).format("DD/MM/YYYY");
    return fromDate === toDate ? fromDate : `${fromDate} → ${toDate}`;
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
