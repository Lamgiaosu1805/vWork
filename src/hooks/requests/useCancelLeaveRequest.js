import { useState } from "react";
import requestsApi from "../../api/requestsApi";

const useCancelLeaveRequest = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (requestId, options = {}) => {
    setIsPending(true);

    try {
      const response = await requestsApi.cancelLeaveRequest(requestId);

      options?.onSuccess?.(response);

      return response;
    } catch (error) {
      console.log("[Error CANCEL leave request]", error.response.data);

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

export default useCancelLeaveRequest;
