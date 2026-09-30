import { useMutation, useQueryClient } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useDeleteFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId) => workplaceApi.deleteFile(fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deptFiles"] }),
  });
};

export default useDeleteFile;
