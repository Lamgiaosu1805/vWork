export const formatMonthLabel = (value) => {
  const month = Number(String(value).replace(/\D/g, ""));
  if (!Number.isFinite(month) || month <= 0) return String(value);

  return `Tháng ${month}`;
};
