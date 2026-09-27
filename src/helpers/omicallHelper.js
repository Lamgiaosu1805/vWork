import Toast from "react-native-toast-message";
import { CALL_ERROR_MESSAGES, ERROR_MESSAGES } from "../constants/omicall";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";
import { Platform } from "react-native";

export const showCallError = (code, fallback) => {
  Toast.show({
    type: "info",
    text1: "Không thể gọi",
    text2: CALL_ERROR_MESSAGES[code] || fallback || `Đã xảy ra lỗi (${code}).`,
  });
};

export const parseErrorMessage = (error) => {
  const errorString =
    error?.message || error?.toString() || "Lỗi không xác định";
  const statusMatch = errorString.match(/Status:\s*(\d+)/);
  if (statusMatch) {
    const code = parseInt(statusMatch[1], 10);
    if (ERROR_MESSAGES[code])
      return Toast.show({ type: "error", text1: ERROR_MESSAGES[code] });
  }
  return errorString;
};

export const requestCallPermissions = async () => {
  const permission = Platform.select({
    ios: PERMISSIONS.IOS.MICROPHONE,
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
  });
  const result = await request(permission);
  console.log("[OMIKIT] Microphone permission:", result);
  return result === RESULTS.GRANTED;
};
