import { useQuery } from "@tanstack/react-query";
import { postsQueryOptions } from "../queries/postQueries";

export function usePosts(enabled = true) {
  return useQuery({
    ...postsQueryOptions(),
    enabled,
  });
}
