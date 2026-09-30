import { useMutation, useQueryClient } from "@tanstack/react-query";
import claimRequestApi from "../api/claimRequestApi";

const useRevokeClaimRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => claimRequestApi.revoke(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crmAllClaimRequests"] }),
  });
};

export default useRevokeClaimRequest;
