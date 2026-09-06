import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { getPost, getPosts } from "../services/postsApi";
import type { Post } from "../types/post";

export const postKeys = {
  all: ["posts"] as const,
  list: ["posts", "list"] as const,
  detail: (id: string) => ["posts", "detail", id] as const,
};

export function postsQueryOptions() {
  return queryOptions({
    queryKey: postKeys.list,
    queryFn: ({ signal }) => getPosts(signal),
  });
}

export function postQueryOptions(queryClient: QueryClient, id: string) {
  return queryOptions({
    queryKey: postKeys.detail(id),
    queryFn: ({ signal }) => getPost(id, signal),
    enabled: Boolean(id),
    // The feed contains the complete post, so details/edit can reuse it.
    initialData: () => queryClient.getQueryData<Post[]>(postKeys.list)?.find((post) => post._id === id),
    initialDataUpdatedAt: () => queryClient.getQueryState(postKeys.list)?.dataUpdatedAt,
  });
}
