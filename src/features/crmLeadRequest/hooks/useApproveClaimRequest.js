import { useMutation, useQueryClient } from "@tanstack/react-query";
import claimRequestApi from "../api/claimRequestApi";

const useApproveClaimRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => claimRequestApi.approve(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crmAllClaimRequests"] }),
  });
};

export default useApproveClaimRequest;
