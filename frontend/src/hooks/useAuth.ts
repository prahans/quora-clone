import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getCurrentUser, login, logout, signup } from "../services/authApi";
import type { CurrentUser } from "../types/auth";
import { advanceSessionVersion } from "../queryClient";

export const currentUserQueryKey = ["currentUser"] as const;

async function replaceSessionCache(
  queryClient: QueryClient,
  user: CurrentUser | null,
) {
  // Stop requests from the previous session before replacing its cached data.
  advanceSessionVersion(queryClient);
  await queryClient.cancelQueries();
  queryClient.clear();
  queryClient.setQueryData(currentUserQueryKey, user);
}

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: ({ signal }) => getCurrentUser(signal),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => replaceSessionCache(queryClient, user),
  });
}

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signup,
    onSuccess: (user) => replaceSessionCache(queryClient, user),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => replaceSessionCache(queryClient, null),
  });
}
