import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerCallApi from "../api/customerCallApi";

const useRecordCallAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => customerCallApi.recordCallAttempt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crmCustomersToCall"] });
    },
  });
};

export default useRecordCallAttempt;
