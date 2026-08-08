import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { getUsersApi } from "../../api/user";

const useGetEmployeesInfinite = ({ search, limit = 20 } = {}) => {
  return useInfiniteQuery({
    queryKey: ["employees", { search, limit }],
    queryFn: async ({ pageParam }) => {
      const res = await getUsersApi({
        page: pageParam,
        limit,
        search: search || undefined,
      });
      return {
        data: res.data?.data ?? [],
        pagination: res.data?.pagination ?? {},
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

export default useGetEmployeesInfinite;
