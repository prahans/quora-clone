import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePostMutationOptions } from "../queries/postMutations";

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation(updatePostMutationOptions(queryClient));
}
