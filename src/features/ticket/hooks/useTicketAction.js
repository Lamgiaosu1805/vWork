import { useMutation, useQueryClient } from "@tanstack/react-query";
import ticketApi from "../api/ticketApi";
import invalidateTicket from "../lib/invalidateTicket";

// Mọi thao tác POST /tickets/:id/<action> (claim, resolve, close, hold, assign...). Lỗi 409 (ticket vừa bị người
// khác đổi) cũng tải lại chi tiết để màn hình có version mới.
const useTicketAction = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, body }) => {
      const res = await ticketApi.runAction({ id, action, body });
      return res.data;
    },
    onSettled: () => invalidateTicket(queryClient, id),
  });
};

export default useTicketAction;
