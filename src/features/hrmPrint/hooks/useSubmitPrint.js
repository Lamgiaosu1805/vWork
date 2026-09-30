import { useMutation, useQueryClient } from "@tanstack/react-query";
import printApi from "../api/printApi";

const useSubmitPrint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => printApi.submit(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["print", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["print", "history"] });
    },
  });
};

export default useSubmitPrint;
