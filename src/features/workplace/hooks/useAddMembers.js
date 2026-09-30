import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import chatApi from "../api/chat";
import { upsertConversation } from "../../../redux/slice/chatSlice";

const useAddMembers = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ conversationId, memberIds }) =>
      chatApi.addMembers(conversationId, { member_ids: memberIds }),
    onSuccess: (res) => {
      const updated = res?.data?.data ?? res?.data ?? res;
      if (updated) dispatch(upsertConversation(updated));
    },
  });
};

export default useAddMembers;
