import { useQuery } from "@tanstack/react-query";
import attendanceApi from "../api/attendanceApi";

const useCurrentWorkSheet = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["currentWorkSheet"],
    queryFn: async () => {
      const res = await attendanceApi.getWorkSheet();
      return res.data?.data?.[0] ?? null;
    },
  });

  return { currentWorkSheet: data ?? null, isLoading, refetch };
};

export default useCurrentWorkSheet;
