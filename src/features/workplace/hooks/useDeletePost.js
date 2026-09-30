import { useMutation } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useDeletePost = () =>
  useMutation({
    mutationFn: (postId) => feedApi.deletePost(postId),
  });

export default useDeletePost;
