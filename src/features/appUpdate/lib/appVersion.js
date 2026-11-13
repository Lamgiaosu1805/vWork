import { Platform } from "react-native";

// expo-application là module native: bản app build trước khi cài thư viện sẽ lỗi lúc import → nạp có bảo vệ.
// Không đọc được version thì không gửi header / không kiểm tra (không chặn nhầm ai).
let Application = null;
try {
  // eslint-disable-next-line global-require
  Application = require("expo-application");
} catch {
  Application = null;
}

// Version thật của bản đã cài (iOS: MARKETING_VERSION, Android: versionName) — KHÔNG lấy từ app.json
export const APP_VERSION = Application?.nativeApplicationVersion ?? null;
export const APP_PLATFORM = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : null;

export const appVersionHeaders = () =>
  APP_VERSION && APP_PLATFORM ? { "x-app-platform": APP_PLATFORM, "x-app-version": APP_VERSION } : {};
