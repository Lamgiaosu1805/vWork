import { useInfiniteQuery } from "@tanstack/react-query";
import agentApi from "../api/agentApi";

const PAGE_SIZE = 20;

const useAgentsList = (params = {}, enabled = true) =>
  useInfiniteQuery({
    queryKey: ["crmAgentsList", params],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await agentApi.getAll({ app_code: "tikluy", ...params, page: pageParam, limit: PAGE_SIZE });
      return {
        items: res.data?.data ?? [],
        page: res.data?.pagination?.page ?? pageParam,
        totalPages: res.data?.pagination?.total_pages ?? 1,
      };
    },
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled,
  });

export default useAgentsList;
