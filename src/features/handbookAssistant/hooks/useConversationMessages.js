import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import handbookAssistantApi from "../api/handbookAssistantApi";
import { QUERY_KEYS } from "../constants";
import { normalizeMessages } from "../lib/normalize";
import { hydrateMessages } from "../store/handbookAssistantSlice";

// Redux là nguồn dữ liệu chính của tin nhắn; chỉ gọi REST khi mở một hội thoại chưa có trong store
// (vd. chọn từ lịch sử) rồi nạp kết quả vào store.
const useConversationMessages = (conversationId) => {
  const dispatch = useDispatch();
  const isLoaded = useSelector(
    (state) =>
      !conversationId ||
      state.handbookAssistant.messagesByConversation[conversationId] !== undefined,
  );

  const query = useQuery({
    queryKey: QUERY_KEYS.messages(conversationId),
    queryFn: async () => {
      const res = await handbookAssistantApi.getConversationMessages(conversationId);
      return normalizeMessages(res.data?.data ?? []);
    },
    enabled: !isLoaded,
    staleTime: Infinity,
    gcTime: 60_000,
  });

  useEffect(() => {
    if (!isLoaded && query.data) dispatch(hydrateMessages({ conversationId, messages: query.data }));
  }, [conversationId, dispatch, isLoaded, query.data]);

  return {
    isLoading: !isLoaded && !query.isError,
    isError: !isLoaded && query.isError,
    refetch: query.refetch,
  };
};

export default useConversationMessages;
