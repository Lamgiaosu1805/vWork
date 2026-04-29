const CHART_MONTH_COUNT = 6;

const getRecentMonthLabels = (count) => {
  const now = new Date();

  return Array.from({ length: count }, (_, index) => {
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() - (count - 1 - index),
      1,
    );
    return `T${monthDate.getMonth() + 1}`;
  });
};

const monthLabels = getRecentMonthLabels(CHART_MONTH_COUNT);

export const dashboardKpis = [
  {
    id: "totalUsers",
    title: "Tổng người dùng",
    value: "6546",
    changeLabel: "+12% vs tháng trước",
    positive: true,
    accent: "#ED2E30",
  },
  {
    id: "investAccounts",
    title: "Tài khoản đầu tư",
    value: "5331",
    changeLabel: "-3% vs tháng trước",
    positive: false,
    accent: "#EAB308",
  },
  {
    id: "aum",
    title: "Tổng tài sản người dùng",
    value: "1.250.000.000 đ",
    changeLabel: "+12% vs tháng trước",
    positive: true,
    accent: "#3B82F6",
  },
  {
    id: "agents",
    title: "Số lượng người nhận hoa hồng",
    value: "10",
    changeLabel: "+12% vs tháng trước",
    positive: true,
    accent: "#A855F7",
  },
];

export const revenueChart = {
  labels: monthLabels,
  values: [500, 700, 650, 780, 680, 920],
};

export const investmentTargetChart = {
  labels: monthLabels,
  investment: [500, 1120, 1150, 1130, 800, 1160],
  target: [760, 780, 790, 800, 790, 780],
};

export const customerSegmentData = [
  {
    id: 0,
    value: 73,
    label: "Khách hàng tiềm năng",
    color: "#22C55E",
  },
  {
    id: 1,
    value: 17,
    label: "Khách hàng thường",
    color: "#3B82F6",
  },
  {
    id: 2,
    value: 10,
    label: "Khách hàng VIP",
    color: "#EF4444",
  },
];

export const topCustomers = [
  {
    id: 1,
    name: "Hoàng Văn Hải",
    amount: "3.000.000.000 đ",
    tag: "VIP",
  },
  {
    id: 2,
    name: "Hoàng Văn Hải",
    amount: "3.000.000.000 đ",
    tag: "VIP",
  },
  {
    id: 3,
    name: "Hoàng Văn Hải",
    amount: "3.000.000.000 đ",
    tag: "VIP",
  },
  {
    id: 4,
    name: "Hoàng Văn Hải",
    amount: "3.000.000.000 đ",
    tag: "VIP",
  },
  {
    id: 5,
    name: "Hoàng Văn Hải",
    amount: "3.000.000.000 đ",
    tag: "VIP",
  },
];

export const recentTransactions = [
  {
    id: 1,
    customer: "Hoàng Văn Hải",
    type: "Nạp tiền",
    amount: "2.000.000 đ",
    positive: true,
  },
  {
    id: 2,
    customer: "Hoàng Văn Hải",
    type: "Nạp tiền",
    amount: "2.000.000 đ",
    positive: true,
  },
  {
    id: 3,
    customer: "Hoàng Văn Hải",
    type: "Rút tiền",
    amount: "1.000.000 đ",
    positive: false,
  },
  {
    id: 4,
    customer: "Hoàng Văn Hải",
    type: "Nạp tiền",
    amount: "2.000.000 đ",
    positive: true,
  },
  {
    id: 5,
    customer: "Hoàng Văn Hải",
    type: "Nạp tiền",
    amount: "2.000.000 đ",
    positive: true,
  },
  {
    id: 6,
    customer: "Hoàng Văn Hải",
    type: "Rút tiền",
    amount: "1.000.000 đ",
    positive: false,
  },
];
