import { useMutation } from "@tanstack/react-query";
import claimRequestApi from "../api/claimRequestApi";

const useSubmitClaimRequest = () =>
  useMutation({
    mutationFn: (payload) => claimRequestApi.create(payload),
  });

export default useSubmitClaimRequest;
