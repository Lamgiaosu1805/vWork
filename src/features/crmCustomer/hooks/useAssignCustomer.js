import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useAssignCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => customerApi.assign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crmAllCustomersList"] });
      queryClient.invalidateQueries({ queryKey: ["crmMyCustomersList"] });
    },
  });
};

export default useAssignCustomer;
