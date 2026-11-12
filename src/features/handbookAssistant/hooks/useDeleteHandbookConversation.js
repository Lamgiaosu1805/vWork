import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import handbookAssistantApi from "../api/handbookAssistantApi";
import { QUERY_KEYS } from "../constants";
import { removeConversation } from "../store/handbookAssistantSlice";

const useDeleteHandbookConversation = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (conversationId) => handbookAssistantApi.deleteConversation(conversationId),
    onSuccess: (_res, conversationId) => {
      queryClient.setQueryData(QUERY_KEYS.conversations, (old) =>
        Array.isArray(old) ? old.filter((c) => c.id !== conversationId) : old,
      );
      queryClient.removeQueries({ queryKey: QUERY_KEYS.messages(conversationId) });
      dispatch(removeConversation(conversationId));
    },
    onError: (error) =>
      Toast.show({
        type: "error",
        text1: error?.response?.data?.message ?? "Không xoá được hội thoại",
      }),
  });
};

export default useDeleteHandbookConversation;
