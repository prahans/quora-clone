import { useQuery, useQueryClient } from "@tanstack/react-query";
import { postQueryOptions } from "../queries/postQueries";

export function usePost(id: string | undefined) {
  const queryClient = useQueryClient();
  return useQuery(postQueryOptions(queryClient, id ?? ""));
}
