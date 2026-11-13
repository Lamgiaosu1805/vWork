import { useMutation, useQueryClient } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";
import invalidateTicket from "../lib/invalidateTicket";

const useRemoveTicketCollaborator = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, version }) => {
      const res = await ticketApi.removeCollaborator({ id, employeeId, version });
      return res.data;
    },
    onSettled: () => invalidateTicket(queryClient, id),
  });
};

export default useRemoveTicketCollaborator;
