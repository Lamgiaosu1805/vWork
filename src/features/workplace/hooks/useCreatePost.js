import { useMutation } from "@tanstack/react-query";
import feedApi from "../api/feedApi";

const useCreatePost = () =>
  useMutation({
    mutationFn: (formData) => feedApi.createPost(formData),
  });

export default useCreatePost;
