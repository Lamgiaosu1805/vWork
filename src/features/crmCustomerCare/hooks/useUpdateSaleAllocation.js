import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerCareApi from "../api/customerCareApi";
import { CARE_QUERY_ROOT } from "../lib/queryKeys";

const useUpdateSaleAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ saleId, appCode, status, reason }) =>
      customerCareApi.updateSaleAllocation(saleId, { status, reason: reason || null, appCode }, { appCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CARE_QUERY_ROOT, "sales"] });
      queryClient.invalidateQueries({ queryKey: [CARE_QUERY_ROOT, "dashboard"] });
    },
  });
};

export default useUpdateSaleAllocation;
