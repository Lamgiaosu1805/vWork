import { useMutation, useQueryClient } from "@tanstack/react-query";
import branchApi from "../api/branchApi";

const useUpdateBranch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => branchApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });
};

export default useUpdateBranch;
