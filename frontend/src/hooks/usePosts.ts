import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getPosts } from "../services/postsApi";

export const postsQueryKey = ["posts"] as const;

export function usePosts() {
  return useQuery({
    queryKey: postsQueryKey,
    queryFn: ({ signal }) => getPosts(signal),
    retry: (failureCount, error) => {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      // Retrying cannot fix authentication or other client errors.
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });
}
