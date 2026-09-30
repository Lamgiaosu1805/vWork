import { useQuery } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useAnnouncementPosts = () =>
  useQuery({
    queryKey: ["posts", { type: "announcement" }],
    queryFn: async () => {
      const res = await feedApi.getPosts({ type: "announcement", limit: 50 });
      return res?.data?.data ?? res?.data ?? [];
    },
  });

export default useAnnouncementPosts;
