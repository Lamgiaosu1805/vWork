import { useMutation } from "@tanstack/react-query";
import authApi from "../api/authApi";

const useLogin = () =>
  useMutation({
    mutationFn: ({ username, password }) => authApi.login(username, password),
  });

export default useLogin;
