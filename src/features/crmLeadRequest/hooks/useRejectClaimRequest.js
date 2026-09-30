import { useMutation, useQueryClient } from "@tanstack/react-query";
import claimRequestApi from "../api/claimRequestApi";

const useRejectClaimRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => claimRequestApi.reject(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crmAllClaimRequests"] }),
  });
};

export default useRejectClaimRequest;
