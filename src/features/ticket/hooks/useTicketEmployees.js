import { keepPreviousData, useQuery } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";

const useTicketEmployees = (q, { assignable = false, enabled = true } = {}) => {
  const { data: employees = [], isFetching } = useQuery({
    queryKey: ["ticket-employees", q, assignable],
    queryFn: async () => {
      const res = await ticketApi.searchEmployees(q, { assignable });
      return res.data?.data ?? [];
    },
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  return { employees, isFetching };
};

export default useTicketEmployees;
