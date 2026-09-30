import { useMutation } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { getUserInfoApi } from "../../../api/user";
import { setCredentials } from "../../../redux/slice/authSlice";

const useRefreshUserInfo = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state.auth.accessToken);

  return useMutation({
    mutationFn: async () => {
      const res = await getUserInfoApi();
      return res.data;
    },
    onSuccess: (user) => dispatch(setCredentials({ user, accessToken })),
  });
};

export default useRefreshUserInfo;
