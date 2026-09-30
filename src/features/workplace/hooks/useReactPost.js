import { useMutation } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useReactPost = () =>
  useMutation({
    mutationFn: ({ postId, type }) => feedApi.reactPost(postId, type),
  });

export default useReactPost;
