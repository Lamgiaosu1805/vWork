import { useMutation } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const usePinPost = () =>
  useMutation({
    mutationFn: (postId) => feedApi.pinPost(postId),
  });

export default usePinPost;
