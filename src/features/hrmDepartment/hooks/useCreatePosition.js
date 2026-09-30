import { useMutation, useQueryClient } from "@tanstack/react-query";
import positionApi from "../api/positionApi";

const useCreatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => positionApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });
};

export default useCreatePosition;
