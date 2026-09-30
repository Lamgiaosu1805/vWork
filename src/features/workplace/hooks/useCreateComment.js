import { useMutation } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useCreateComment = () =>
  useMutation({
    mutationFn: ({ postId, content }) => feedApi.createComment(postId, content),
  });

export default useCreateComment;
