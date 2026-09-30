import { useMutation } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useDeleteComment = () =>
  useMutation({
    mutationFn: ({ postId, commentId }) => feedApi.deleteComment(postId, commentId),
  });

export default useDeleteComment;
