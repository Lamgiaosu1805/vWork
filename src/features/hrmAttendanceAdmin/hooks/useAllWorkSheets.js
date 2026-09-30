import { useQuery } from "@tanstack/react-query";
import attendanceAdminApi from "../api/attendanceAdminApi";

const useAllWorkSheets = (date) =>
  useQuery({
    queryKey: ["allWorkSheets", date],
    queryFn: async () => {
      const res = await attendanceAdminApi.getAllWorkSheets(date);
      return res.data?.data ?? [];
    },
    enabled: !!date,
  });

export default useAllWorkSheets;
