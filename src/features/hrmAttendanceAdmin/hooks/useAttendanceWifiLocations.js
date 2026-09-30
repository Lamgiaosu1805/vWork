import { useQuery } from "@tanstack/react-query";
import attendanceAdminApi from "../api/attendanceAdminApi";

const useAttendanceWifiLocations = () =>
  useQuery({
    queryKey: ["attendanceWifiLocations"],
    queryFn: async () => {
      const res = await attendanceAdminApi.getAllowedWifiLocations();
      return res.data?.data ?? [];
    },
  });

export default useAttendanceWifiLocations;
