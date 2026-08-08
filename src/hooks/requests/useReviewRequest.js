import { useMutation, useQueryClient } from "@tanstack/react-query";
import requestsApi from "../../api/requestsApi";

const useReviewRequest = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ requestId, payload }) =>
      requestsApi.reviewRequest(requestId, payload),
    onSuccess: () => {
      // Danh sách chờ duyệt (admin/manager) và danh sách đơn của chính nhân viên đều có thể bị ảnh
      // hưởng bởi 1 lượt duyệt/từ chối — invalidate cả 2 để không phải phụ thuộc refetch() thủ công
      // ở từng màn hình gọi hook này.
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
