import { COLORS } from "../../assets/theme/colors";

export const TAB_CONFIG = {
  DashboardHRMScreen: {
    title: "HRM",
    icon: "people",
  },
  attendance: {
    title: "Chấm công",
    icon: "alarm",
  },
  requests: {
    title: "Yêu cầu",
    icon: "create",
  },
  profile: {
    title: "Hồ sơ",
    icon: "person",
  },
  expand: {
    title: "Mở rộng",
    icon: "apps",
  },
  dashboard: {
    title: "Workplace",
    icon: "business-outline",
  },
  feed: {
    title: "Bảng tin",
    icon: "newspaper-outline",
  },
  chat: {
    title: "Chat",
    icon: "chatbubbles-outline",
  },
  "weekly-report": {
    title: "Báo cáo",
    icon: "calendar-outline",
  },
  "internal-files": {
    title: "Ổ File",
    icon: "folder-open-outline",
  },
};

export const getTabColor = (focused) =>
  focused ? COLORS.Primary : COLORS.neutral.neutral400;
