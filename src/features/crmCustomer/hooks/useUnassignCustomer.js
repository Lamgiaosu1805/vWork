import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerApi from "../api/customerApi";

const useUnassignCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => customerApi.unassignSale(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crmAllCustomersList"] });
      queryClient.invalidateQueries({ queryKey: ["crmMyCustomersList"] });
    },
  });
};

export default useUnassignCustomer;
