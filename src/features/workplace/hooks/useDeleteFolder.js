import { useMutation, useQueryClient } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deptId, folderId }) => workplaceApi.deleteFolder(deptId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deptFolders"] });
      queryClient.invalidateQueries({ queryKey: ["deptFiles"] });
    },
  });
};

export default useDeleteFolder;
