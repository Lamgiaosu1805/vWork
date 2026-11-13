import { useQuery } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";

const useTicketSearch = (q) => {
  const keyword = q.trim();
  const { data: results = [], isFetching } = useQuery({
    queryKey: ["ticket-search", keyword],
    queryFn: async () => {
      const res = await ticketApi.searchTickets(keyword);
      return res.data?.data ?? [];
    },
    enabled: keyword.length >= 2,
  });

  return { results, isFetching };
};

export default useTicketSearch;
