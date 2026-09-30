import { useMutation } from "@tanstack/react-query";
import chatApi from "../api/chat";

const useCreateGroupConversation = () =>
  useMutation({
    mutationFn: ({ name, members }) => chatApi.createGroupConversation({ name, members }),
  });

export default useCreateGroupConversation;
