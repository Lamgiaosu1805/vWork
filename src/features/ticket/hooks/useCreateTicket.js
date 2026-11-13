import { useMutation, useQueryClient } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";
import invalidateTicket from "../lib/invalidateTicket";

const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, files }) => {
      const res = await ticketApi.createTicket({ payload, files });
      return res.data?.data;
    },
    onSuccess: () => invalidateTicket(queryClient),
  });
};

export default useCreateTicket;
