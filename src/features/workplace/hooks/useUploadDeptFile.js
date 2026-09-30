import { useMutation, useQueryClient } from "@tanstack/react-query";
import workplaceApi from "../api/workplaceApi";

const useUploadDeptFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deptId, formData }) => workplaceApi.uploadDeptFile(deptId, formData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["deptFiles"] }),
  });
};

export default useUploadDeptFile;
