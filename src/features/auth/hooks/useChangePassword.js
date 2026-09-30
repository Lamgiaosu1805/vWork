import { useMutation } from "@tanstack/react-query";
import authApi from "../api/authApi";

const useChangePassword = () =>
  useMutation({
    mutationFn: ({ currentPassword, newPassword }) => authApi.changePassword(currentPassword, newPassword),
  });

export default useChangePassword;
