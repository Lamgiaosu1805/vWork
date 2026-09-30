import { useMutation } from "@tanstack/react-query";
import authApi from "../api/authApi";

const useChangeFirstPassword = () =>
  useMutation({
    mutationFn: ({ tempToken, newPassword }) => authApi.changeFirstPassword(tempToken, newPassword),
  });

export default useChangeFirstPassword;
