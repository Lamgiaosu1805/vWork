import { useMutation, useQueryClient } from "@tanstack/react-query";
import departmentApi from "../api/departmentApi";

const useDeleteDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => departmentApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
};

export default useDeleteDepartment;
