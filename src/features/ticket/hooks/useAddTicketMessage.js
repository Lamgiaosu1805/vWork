import { useMutation, useQueryClient } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";
import invalidateTicket from "../lib/invalidateTicket";

const useAddTicketMessage = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, files }) => {
      const res = await ticketApi.addMessage({ id, payload, files });
      return res.data;
    },
    onSuccess: () => invalidateTicket(queryClient, id),
  });
};

export default useAddTicketMessage;
