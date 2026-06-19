import { useCallback, useRef, useState } from "react";
import chatApi from "../../api/chat";
import { setLoadingMessages, setMessages } from "../../redux/slice/chatSlice";

const LIMIT = 15;

export default function useChatMessages({
  conversationId,
  dispatch,
  messagesByConversationId,
}) {
  const pageRef = useRef(1);

  const [loadingMore, setLoadingMore] = useState(false);

  const [hasMore, setHasMore] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    pageRef.current = 1;

    setHasMore(true);

    dispatch(
      setLoadingMessages({
        conversationId,
        loading: true,
      }),
    );

    try {
      const res = await chatApi.getMessages(conversationId, 1, LIMIT);

      const items = res?.data?.data ?? res?.data ?? [];

      dispatch(
        setMessages({
          conversationId,
          messages: items,
        }),
      );
    } finally {
      dispatch(
        setLoadingMessages({
          conversationId,
          loading: false,
        }),
      );
    }
  }, [conversationId]);

  const loadMore = useCallback(async () => {
    if (!conversationId || !hasMore || loadingMore) {
      return;
    }

    const nextPage = pageRef.current + 1;

    setLoadingMore(true);

    try {
      const res = await chatApi.getMessages(conversationId, nextPage, LIMIT);

      const items = res?.data?.data ?? res?.data ?? [];

      if (!items.length) {
        setHasMore(false);
        return;
      }

      pageRef.current = nextPage;

      const current = messagesByConversationId[conversationId] ?? [];

      dispatch(
        setMessages({
          conversationId,
          messages: [...items, ...current],
        }),
      );

      setHasMore(items.length === LIMIT);
    } finally {
      setLoadingMore(false);
    }
  }, [conversationId, hasMore, loadingMore, messagesByConversationId]);

  return {
    loadMessages,
    loadMore,
    loadingMore,
    hasMore,
    pageRef,
  };
}
