import { useQuery } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useComments = (postId) =>
  useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await feedApi.getComments(postId);
      return res?.data?.data ?? res?.data ?? [];
    },
    enabled: !!postId,
  });

export default useComments;
