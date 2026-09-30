import { useQuery } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useAdminReports = (enabled = true) =>
  useQuery({
    queryKey: ["adminReports"],
    queryFn: async () => {
      const res = await workplaceApi.getAdminReports();
      return res.data?.data ?? [];
    },
    enabled,
  });

export default useAdminReports;
