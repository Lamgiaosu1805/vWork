import { useQuery } from "@tanstack/react-query";
import requestsApi from "../../api/requestsApi";

const useGetRequestById = (requestId) => {
  return useQuery({
    queryKey: ["requests", "detail", requestId],
    queryFn: async () => {
      const res = await requestsApi.getRequestById(requestId);
      return res.data?.data;
    },
    enabled: !!requestId,
  });
};

export default useGetRequestById;
