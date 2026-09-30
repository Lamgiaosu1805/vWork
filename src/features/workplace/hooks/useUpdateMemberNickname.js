import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import chatApi from "../api/chat";
import { upsertConversation } from "../../../redux/slice/chatSlice";

const useUpdateMemberNickname = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ conversationId, memberId, nickname }) =>
      chatApi.updateMemberNickname(conversationId, memberId, nickname),
    onSuccess: (res) => {
      const updated = res?.data?.data ?? res?.data ?? res;
      if (updated) dispatch(upsertConversation(updated));
    },
  });
};

export default useUpdateMemberNickname;
