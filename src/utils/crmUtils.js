export const formatMonthLabel = (value) => {
  const month = Number(String(value).replace(/\D/g, ""));
  if (!Number.isFinite(month) || month <= 0) return String(value);

  return `Tháng ${month}`;
};

const parseRevenueValue = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;

  const cleaned = value
    .replace(/\s+/g, "")
    .replace(/[.,]/g, "")
    .replace(/[^\d-]/g, "");

  return Number(cleaned);
};

export const formatMoney = (value) => {
  if (!value) return "---";

  const number = Number(String(value).replaceAll(",", ""));

  return `${number.toLocaleString("vi-VN")} đ`;
};

export const fmtDate = (d) =>
  d
    ? `${String(d.date()).padStart(2, "0")}/${String(d.month() + 1).padStart(2, "0")}/${d.year()}`
    : null;

export const formatRevenueCompact = (value, fractionDigits = 2) => {
  const revenue = parseRevenueValue(value);
  if (!Number.isFinite(revenue)) return "0";

  const absRevenue = Math.abs(revenue);
  const units = [
    { divisor: 1e12, label: "nghìn tỷ" },
    { divisor: 1e9, label: "tỷ" },
    { divisor: 1e6, label: "triệu" },
    { divisor: 1e3, label: "nghìn" },
  ];

  const matchedUnit = units.find((unit) => absRevenue >= unit.divisor);
  if (!matchedUnit) {
    return new Intl.NumberFormat("vi-VN").format(revenue);
  }

  const compactValue = revenue / matchedUnit.divisor;
  return `${new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(compactValue)} ${matchedUnit.label}`;
};
