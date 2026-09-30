import { useMutation, useQueryClient } from "@tanstack/react-query";
import branchApi from "../api/branchApi";

const useDeleteBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => branchApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });
};

export default useDeleteBranch;
