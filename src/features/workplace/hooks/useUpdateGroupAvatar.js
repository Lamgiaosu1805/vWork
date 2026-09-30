import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import chatApi from "../api/chat";
import { upsertConversation } from "../../../redux/slice/chatSlice";

const useUpdateGroupAvatar = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ conversationId, formData }) =>
      chatApi.updateGroupConversationAvatar(conversationId, formData),
    onSuccess: (res) => {
      const updated = res?.data?.data ?? res?.data ?? res;
      if (updated) dispatch(upsertConversation(updated));
    },
  });
};

export default useUpdateGroupAvatar;
