import dayjs from "dayjs";
import { PERIOD_LABEL } from "../constants/hrm";

export const getRequestTypeLabel = (item) => {
  if (item.request_type === "leave") {
    return item.leave_type === "paid"
      ? "Nghỉ phép có lương"
      : "Nghỉ phép không lương";
  }
  if (item.request_type === "forgot_checkin") {
    return item.type === "check_in" ? "Quên check-in" : "Quên check-out";
  }
  if (item.request_type === "late_early") {
    return item.late_early_type === "late" ? "Đi muộn" : "Về sớm";
  }
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
  if (item.date) return dayjs(item.date).format("DD/MM/YYYY");
  return "--";
};