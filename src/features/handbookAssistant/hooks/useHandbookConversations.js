import { useQuery } from "@tanstack/react-query";
import handbookAssistantApi from "../api/handbookAssistantApi";
import { QUERY_KEYS } from "../constants";
import { normalizeConversation } from "../lib/normalize";

const useHandbookConversations = (enabled = true) => {
  const query = useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: async () => {
      const res = await handbookAssistantApi.getConversations();
      return (res.data?.data ?? []).map(normalizeConversation);
    },
    enabled,
    staleTime: 30_000,
  });
  return { ...query, conversations: query.data ?? [] };
};

export default useHandbookConversations;
