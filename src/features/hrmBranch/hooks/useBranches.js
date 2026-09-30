import { useQuery } from "@tanstack/react-query";
import branchApi from "../api/branchApi";

const useBranches = (options = {}) =>
  useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await branchApi.getAll();
      return res.data?.data ?? [];
    },
    ...options,
  });

export default useBranches;
