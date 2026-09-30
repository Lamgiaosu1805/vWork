import { useQuery } from "@tanstack/react-query";
import positionApi from "../api/positionApi";

const usePositions = () =>
  useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const res = await positionApi.getAll();
      return res.data?.data ?? [];
    },
  });

export default usePositions;
