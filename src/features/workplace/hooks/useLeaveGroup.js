import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import chatApi from "../api/chat";
import { deleteConversation } from "../../../redux/slice/chatSlice";

const useLeaveGroup = () => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (conversationId) => chatApi.leaveGroup(conversationId),
    onSuccess: (_res, conversationId) => {
      dispatch(deleteConversation(conversationId));
    },
  });
};

export default useLeaveGroup;
