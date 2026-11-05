import { useQuery } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";

const useTicketDepartments = ({ enabled = true } = {}) => {
  const { data: departments = [], isLoading } = useQuery({
    queryKey: ["ticket-departments"],
    queryFn: async () => {
      const res = await ticketApi.getDepartments();
      return res.data?.data ?? [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return { departments, isLoading };
};

export default useTicketDepartments;
