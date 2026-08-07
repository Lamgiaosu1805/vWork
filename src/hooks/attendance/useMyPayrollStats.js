import { useQuery } from "@tanstack/react-query";
import attendanceApi from "../../api/attendanceApi";

const useMyPayrollStats = (month, year) =>
  useQuery({
    queryKey: ["myPayrollStats", month, year],
    queryFn: async () => {
      const res = await attendanceApi.getMyPayrollStats(month, year);
      return res.data;
    },
    enabled: !!month && !!year,
  });

export default useMyPayrollStats;
