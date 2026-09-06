import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

// A response from an earlier account must not restore data after the cache is cleared.
const sessionVersions = new WeakMap<QueryClient, number>();

export function getSessionVersion(queryClient: QueryClient) {
  return sessionVersions.get(queryClient) ?? 0;
}

export function advanceSessionVersion(queryClient: QueryClient) {
  sessionVersions.set(queryClient, getSessionVersion(queryClient) + 1);
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Page changes reuse fresh data; unused data stays available for 30 minutes.
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: (failureCount, error) => {
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;
          if (status && status >= 400 && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
