import { useQuery } from "@tanstack/react-query";
import shiftApi from "../api/shift";

const useGetAllShift = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["shifts"],
    queryFn: async () => {
      const res = await shiftApi.getAllShifts();
      return res?.data?.data ?? [];
    },
  });

  return { data: data ?? [], isLoading, refetch };
};

export default useGetAllShift;
