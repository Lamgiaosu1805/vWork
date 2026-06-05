import { useState } from "react";
import requestsApi from "../../api/requestsApi";

const useCreateRequest = () => {
  const [isPending, setIsPending] = useState(false);

  const mutate = async (payload, options = {}) => {
    setIsPending(true);

    try {
      const response = await requestsApi.createRequest(payload);
        
      options?.onSuccess?.(response);

      return response;
    } catch (error) {
      console.log("[Error CREATE request]", error);
        console.log(error.response?.data.message);

      options?.onError?.(error.response?.data.message);

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

export default useCreateRequest;
