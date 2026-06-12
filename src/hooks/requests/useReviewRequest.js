import { useState } from "react";
import requestsApi from "../../api/requestsApi";

const useReviewRequest = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (requestId, payload, options = {}) => {
    setIsPending(true);

    try {
      const response = await requestsApi.reviewRequest(requestId, payload);
      
      options?.onSuccess?.(response);

      return response;
    } catch (error) {
      console.log("[Error REVIEW request]", error);

      options?.onError?.(error);

      return null;
    } finally {
      setIsPending(false);
    }
  };

  return {
    mutate,
    isPending,
  };
};

export default useReviewRequest;
