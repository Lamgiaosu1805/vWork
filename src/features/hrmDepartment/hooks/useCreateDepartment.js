import { useMutation, useQueryClient } from "@tanstack/react-query";
import departmentApi from "../api/departmentApi";

const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => departmentApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
  });
};

export default useCreateDepartment;
