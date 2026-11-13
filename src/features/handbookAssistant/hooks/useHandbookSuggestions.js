import { useQuery } from "@tanstack/react-query";
import handbookAssistantApi from "../api/handbookAssistantApi";
import { QUERY_KEYS } from "../constants";
import { normalizeSuggestion } from "../lib/normalize";

const useHandbookSuggestions = (enabled = true) => {
  const query = useQuery({
    queryKey: QUERY_KEYS.suggestions,
    queryFn: async () => {
      const res = await handbookAssistantApi.getSuggestions();
      return (res.data?.data ?? []).map(normalizeSuggestion).filter(Boolean);
    },
    enabled,
    staleTime: 10 * 60_000,
  });
  return { ...query, suggestions: query.data ?? [] };
};

export default useHandbookSuggestions;
