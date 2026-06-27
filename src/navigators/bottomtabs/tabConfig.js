import { COLORS } from "../../assets/theme/colors";

export const TAB_CONFIG = {
  DashboardHRMScreen: {
    title: "HRM",
    icon: "people",
  },
  AttendanceScreen: {
    title: "Chấm công",
    icon: "alarm",
  },
  RequestScreen: {
    title: "Yêu cầu",
    icon: "create",
  },
  ProfileScreen: {
    title: "Hồ sơ",
    icon: "person",
  },
  ExpandScreen: {
    title: "Mở rộng",
    icon: "apps",
  },
  Dashboard: {
    title: "Home CRM",
    icon: "cart-outline",
  },
  Customers: {
    title: "Khách hàng",
    icon: "people-outline",
  },
  KPI: {
    title: "KPI",
    icon: "stats-chart-outline",
  },
  Commission: {
    title: "Hoa hồng",
    icon: "cash-outline",
  },
  WorkplaceDashboard: {
    title: "Workplace",
    icon: "business-outline",
  },
  FeedScreen: {
    title: "Bảng tin",
    icon: "newspaper-outline",
  },
  ChatScreen: {
    title: "Chat",
    icon: "chatbubbles-outline",
  },
  WeeklyReportScreen: {
    title: "Báo cáo",
    icon: "calendar-outline",
  },
  InternalFilesScreen: {
    title: "Ổ File",
    icon: "folder-open-outline",
  },
};

export const getTabColor = (focused) =>
  focused ? COLORS.Primary : COLORS.neutral.neutral400;
