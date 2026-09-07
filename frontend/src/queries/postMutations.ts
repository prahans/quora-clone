import type { QueryClient } from "@tanstack/react-query";
import { createPost, deletePost, updatePost } from "../services/postsApi";
import { postKeys } from "./postQueries";
import { getSessionVersion } from "../queryClient";
import type {
  CreatePostInput,
  Post,
  UpdatePostInput,
  UpdatePostResult,
} from "../types/post";

async function cacheSavedPost(
  queryClient: QueryClient,
  savedPost: Post,
  isNew: boolean,
  sessionVersion: number,
) {
  if (sessionVersion !== getSessionVersion(queryClient)) return;
  await queryClient.cancelQueries({ queryKey: postKeys.all });
  if (sessionVersion !== getSessionVersion(queryClient)) return;
  const listUpdatedAt = queryClient.getQueryState(postKeys.list)?.dataUpdatedAt;
  queryClient.setQueryData(postKeys.detail(savedPost._id), savedPost);
  queryClient.setQueryData<Post[]>(
    postKeys.list,
    (posts) => {
      if (!posts) return undefined;
      const exists = posts.some((post) => post._id === savedPost._id);
      if (isNew && !exists) return [...posts, savedPost];
      return posts.map((post) =>
        post._id === savedPost._id ? savedPost : post,
      );
    },
    // Saving one post does not make every other post in the feed newer.
    { updatedAt: listUpdatedAt },
  );
}

export function createPostMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: createPost,

    onMutate: () => getSessionVersion(queryClient),

    onSuccess: (post: Post, _input: CreatePostInput, sessionVersion: number) =>
      cacheSavedPost(queryClient, post, true, sessionVersion),
  };
}

export function updatePostMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: updatePost,
    onMutate: () => getSessionVersion(queryClient),
    onSuccess: (
      result: UpdatePostResult,
      _input: UpdatePostInput,
      sessionVersion: number,
    ) => cacheSavedPost(queryClient, result.post, false, sessionVersion),
  };
}

export function deletePostMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: deletePost,
    onMutate: () => getSessionVersion(queryClient),
    onSuccess: async (_data: void, id: string, sessionVersion: number) => {
      if (sessionVersion !== getSessionVersion(queryClient)) return;
      await queryClient.cancelQueries({ queryKey: postKeys.all });
      if (sessionVersion !== getSessionVersion(queryClient)) return;
      const listUpdatedAt = queryClient.getQueryState(
        postKeys.list,
      )?.dataUpdatedAt;
      queryClient.setQueryData<Post[]>(
        postKeys.list,
        (posts) => posts?.filter((post) => post._id !== id),
        { updatedAt: listUpdatedAt },
      );
      queryClient.removeQueries({ queryKey: postKeys.detail(id), exact: true });
    },
  };
}
