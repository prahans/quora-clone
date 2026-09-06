import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePost } from "../services/postsApi";
import type { Post } from "../types/post";
import { postsQueryKey } from "./usePosts";

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePost,
    onSuccess: async (_data, id) => {
      // Prevent an older feed request from restoring the deleted post.
      await queryClient.cancelQueries({ queryKey: postsQueryKey });
      queryClient.setQueryData<Post[]>(postsQueryKey, (posts) =>
        posts?.filter((post) => post._id !== id),
      );
      await queryClient.invalidateQueries({ queryKey: postsQueryKey });
    },
  });
}
