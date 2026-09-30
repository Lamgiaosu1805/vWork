import { useMutation } from "@tanstack/react-query";
import chatApi from "../api/chat";

const useCreatePrivateConversation = () =>
  useMutation({
    mutationFn: (receiverId) => chatApi.createPrivateConversation({ receiver_id: receiverId }),
  });

export default useCreatePrivateConversation;
