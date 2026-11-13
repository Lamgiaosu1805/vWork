import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";
import handbookAssistantApi from "../api/handbookAssistantApi";
import { setFeedback } from "../store/handbookAssistantSlice";

// Cập nhật 👍/👎 ngay trên giao diện, hoàn tác nếu server báo lỗi.
const useMessageFeedback = (conversationKey) => {
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: ({ messageId, value, comment }) =>
      handbookAssistantApi.sendFeedback(messageId, { value, comment: comment || undefined }),
    onMutate: ({ messageId, value, previous }) => {
      dispatch(setFeedback({ conversationKey, messageId, feedback: value }));
      return { previous };
    },
    onError: (error, { messageId }, context) => {
      dispatch(setFeedback({ conversationKey, messageId, feedback: context?.previous ?? null }));
      Toast.show({
        type: "error",
        text1: error?.response?.data?.message ?? "Không gửi được đánh giá",
      });
    },
  });
};

export default useMessageFeedback;
