import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import attendanceApi from "../api/attendanceApi";
import {
  resolveLocationPayload,
  showLocationPermissionAlert,
} from "../lib/resolveLocationPayload";

const useCheckOut = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const payload = await resolveLocationPayload();
      const res = await attendanceApi.checkOut(payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["currentWorkSheet"] });
      queryClient.invalidateQueries({ queryKey: ["lichCong"] });
      Toast.show({
        type: "success",
        text1: "Thông báo",
        text2: data.message || "Check out thành công!",
      });
    },
    onError: (error) => {
      if (error.message === "LOCATION_PERMISSION_DENIED") {
        showLocationPermissionAlert();
        return;
      }
      Toast.show({
        type: "error",
        text1: "Thông báo",
        text2: error.response?.data?.message || error.message,
      });
    },
  });
};

export default useCheckOut;
