import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import requestsApi from "../../api/requestsApi";
import { isAlreadyApprovedByMe } from "../../helpers/request";

const useGetRequestsInfinite = ({
  request_type,
  status,
  search,
  from,
  to,
  limit = 6,
}) => {
  const user = useSelector((s) => s.auth.user);

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
      const page = Array.isArray(body) ? { data: body, pagination: {} } : body;

      return {
        ...page,
        data: (page.data ?? []).map((item) => ({
          ...item,
          alreadyApprovedByMe: isAlreadyApprovedByMe(item, user),
        })),
      };
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
