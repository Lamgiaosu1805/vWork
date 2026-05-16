import { useState } from "react";
import Toast from "react-native-toast-message";
import { changePassword as changePasswordApi } from "../api/auth";

const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      const response = await changePasswordApi(currentPassword, newPassword);
      setLoading(false);
      Toast.show({
        type: "success",
        text1: "Thông báo",
        text2: "Mật khẩu đã được thay đổi",
      });
      return response;
    } catch (err) {
      console.log("[Error ChangePassword]", err);
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Thông báo",
        text2: errorMessage,
      });
      throw err;
    }
  };

  return {
    changePassword,
    loading,
    error,
  };
};

export default useAuth;
