import { useQuery } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useReportHistory = (deptId, params) =>
  useQuery({
    queryKey: ["reportHistory", deptId, params],
    queryFn: async () => {
      const res = await workplaceApi.getReportHistory(deptId, params);
      return res.data?.data ?? [];
    },
    enabled: !!deptId,
  });

export default useReportHistory;
