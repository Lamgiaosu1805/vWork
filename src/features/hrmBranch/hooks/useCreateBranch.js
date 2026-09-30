import { useMutation, useQueryClient } from "@tanstack/react-query";
import branchApi from "../api/branchApi";

const useCreateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => branchApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });
};

export default useCreateBranch;
