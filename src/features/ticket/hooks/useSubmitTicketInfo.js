import { useMutation, useQueryClient } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";
import invalidateTicket from "../lib/invalidateTicket";

const useSubmitTicketInfo = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ payload, files }) => {
      const res = await ticketApi.submitInfo({ id, payload, files });
      return res.data;
    },
    onSettled: () => invalidateTicket(queryClient, id),
  });
};

export default useSubmitTicketInfo;
