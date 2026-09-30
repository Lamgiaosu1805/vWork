import { useQuery } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useMyDeptReport = () =>
  useQuery({
    queryKey: ["myDeptReport"],
    queryFn: async () => {
      const res = await workplaceApi.getMyDeptReport();
      return res.data?.data ?? [];
    },
  });

export default useMyDeptReport;
