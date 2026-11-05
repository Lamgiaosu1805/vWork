import { useQuery } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";

const useTicketDetail = (id) => {
  const query = useQuery({
    queryKey: ["ticket-detail", id],
    queryFn: async () => {
      const res = await ticketApi.getTicketDetail(id);
      return res.data?.data ?? null;
    },
    enabled: Boolean(id),
    staleTime: 15_000,
  });

  return { ...query, ticket: query.data };
};

export default useTicketDetail;
