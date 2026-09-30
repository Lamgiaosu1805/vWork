import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useReassignCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => customerApi.reassign(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crmAllCustomersList"] });
      queryClient.invalidateQueries({ queryKey: ["crmMyCustomersList"] });
    },
  });
};

export default useReassignCustomer;
