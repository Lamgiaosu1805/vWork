import { useMutation } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useCreateCommentWithImage = () =>
  useMutation({
    mutationFn: ({ postId, content, imageUri }) =>
      feedApi.createCommentWithImage(postId, { content, imageUri }),
  });

export default useCreateCommentWithImage;
