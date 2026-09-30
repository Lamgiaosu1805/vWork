import { useMutation, useQueryClient } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useCreateFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deptId, name, parentId }) => workplaceApi.createFolder(deptId, name, parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deptFolders"] }),
  });
};

export default useCreateFolder;
