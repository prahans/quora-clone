import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePostMutationOptions } from "../queries/postMutations";

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation(deletePostMutationOptions(queryClient));
}
