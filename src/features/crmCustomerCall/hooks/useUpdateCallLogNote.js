import { useMutation, useQueryClient } from "@tanstack/react-query";
import customerCallApi from "../api/customerCallApi";

const useUpdateCallLogNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }) => customerCallApi.updateCallLogNote(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crmCallHistory"] });
    },
  });
};

export default useUpdateCallLogNote;
