import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import requestsApi from "../../api/requestsApi";

const useGetMyRequestsInfinite = ({
  request_type,
  status,
  from,
  to,
  limit = 5,
}) => {
  return useInfiniteQuery({
    queryKey: ["myRequests", { request_type, status, from, to, limit }],
    queryFn: async ({ pageParam }) => {
      const res = await requestsApi.getMyRequests({
        request_type,
        status,
        from,
        to,
        limit,
        page: pageParam,
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = lastPage?.pagination?.total_pages ?? 1;
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    placeholderData: keepPreviousData,
  });
};

export default useGetMyRequestsInfinite;
