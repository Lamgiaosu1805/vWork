import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerCallApi from "../api/customerCallApi";

const useUpdateRelationshipStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => customerCallApi.updateRelationshipStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crmCustomersToCall"] });
    },
  });
};

export default useUpdateRelationshipStatus;
