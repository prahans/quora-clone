import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostMutationOptions } from "../queries/postMutations";

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation(createPostMutationOptions(queryClient));
}
