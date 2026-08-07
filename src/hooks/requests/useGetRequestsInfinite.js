import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import requestsApi from "../../api/requestsApi";

const useGetRequestsInfinite = ({
  request_type,
  status,
  search,
  from,
  to,
  limit = 6,
}) => {
  return useInfiniteQuery({
    queryKey: ["requests", { request_type, status, search, from, to, limit }],
    queryFn: async ({ pageParam }) => {
      const res = await requestsApi.getRequests({
        request_type,
        status,
        search,
        from,
        to,
        limit,
        page: pageParam,
      });
      const body = res.data;
      return Array.isArray(body) ? { data: body, pagination: {} } : body;
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

export default useGetRequestsInfinite;
