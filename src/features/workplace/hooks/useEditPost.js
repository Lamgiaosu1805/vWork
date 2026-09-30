import { useMutation } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useEditPost = () =>
  useMutation({
    mutationFn: ({ postId, formData }) => feedApi.editPost(postId, formData),
  });

export default useEditPost;
