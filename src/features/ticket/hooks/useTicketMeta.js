import { useSelector } from "react-redux";
import ticketApi from "../api/ticketApi";
import { useQuery } from "@tanstack/react-query";

const useTicketMeta = () => {
  const accessToken = useSelector((state) => state.auth.accessToken);

  const { data: meta = {}, isLoading } = useQuery({
    queryKey: ["ticket-meta"],
    queryFn: async () => {
      const res = await ticketApi.getMeta();
      return res.data?.data ?? {};
    },
    enabled: !!accessToken,
    staleTime: 5 * 60 * 1000,
  });

  return { meta, isLoading };
};

export default useTicketMeta;
