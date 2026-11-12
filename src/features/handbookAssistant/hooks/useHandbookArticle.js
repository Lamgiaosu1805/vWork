import { useQuery } from "@tanstack/react-query";
import handbookAssistantApi from "../api/handbookAssistantApi";
import { QUERY_KEYS } from "../constants";

// Nguyên văn một điều/mục: { documentCode, documentTitle, articleIdx, label, title, content }
const useHandbookArticle = (documentCode, articleIdx) => {
  const query = useQuery({
    queryKey: QUERY_KEYS.article(documentCode, articleIdx),
    queryFn: async () => {
      const res = await handbookAssistantApi.getArticle(documentCode, articleIdx);
      return res.data?.data ?? null;
    },
    enabled: Boolean(documentCode) && articleIdx !== undefined && articleIdx !== null && articleIdx !== "",
    staleTime: 30 * 60_000,
  });
  return { ...query, article: query.data };
};

export default useHandbookArticle;
