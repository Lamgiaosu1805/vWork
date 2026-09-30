import { useMutation } from "@tanstack/react-query";
import authApi from "../api/authApi";

const useFetchUserInfoWithToken = () =>
  useMutation({
    mutationFn: (token) => authApi.getUserInfoWithToken(token),
  });

export default useFetchUserInfoWithToken;
