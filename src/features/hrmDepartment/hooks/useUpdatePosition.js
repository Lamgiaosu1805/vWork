import { useMutation, useQueryClient } from "@tanstack/react-query";
import positionApi from "../api/positionApi";

const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => positionApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["positions"] }),
  });
};

export default useUpdatePosition;
