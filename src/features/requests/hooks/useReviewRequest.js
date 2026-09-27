import { useMutation, useQueryClient } from "@tanstack/react-query";
import requestsApi from "../api/requestsApi";

const useReviewRequest = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ requestId, payload }) =>
      requestsApi.reviewRequest(requestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["myRequests"] });
    },
  });

  const mutate = (requestId, payload, options = {}) => {
    mutation.mutate(
      { requestId, payload },
      {
        onSuccess: (response) => options?.onSuccess?.(response),
        onError: (error) => {
          console.log("[Error REVIEW request]", error);
          options?.onError?.(error);
        },
      },
    );
  };

  return {
    mutate,
    isPending: mutation.isPending,
  };
};

export default useReviewRequest;
