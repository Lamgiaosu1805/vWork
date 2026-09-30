import { useMutation, useQueryClient } from "@tanstack/react-query";
import departmentApi from "../api/departmentApi";

const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => departmentApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
};

export default useUpdateDepartment;
