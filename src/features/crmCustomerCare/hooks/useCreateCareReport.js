import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerCareApi from "../api/customerCareApi";
import { CARE_QUERY_KEYS } from "../lib/queryKeys";

const useCreateCareReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ externalId, body }) => customerCareApi.createInteraction(externalId, body),
    onSuccess: (_res, { externalId, customerId }) => {
      queryClient.invalidateQueries({ queryKey: CARE_QUERY_KEYS.myQueue });
      queryClient.invalidateQueries({ queryKey: CARE_QUERY_KEYS.interactions(externalId) });
      if (customerId) queryClient.invalidateQueries({ queryKey: CARE_QUERY_KEYS.history(customerId) });
    },
  });
};

export default useCreateCareReport;
