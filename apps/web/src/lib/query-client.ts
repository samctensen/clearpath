import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api.ts";

export const LIVE_REFRESH_MS = 30_000;
export const queryKeys = {
  all: ["clearpath"] as const,
  dashboard: ["clearpath", "dashboard"] as const,
  resource: (path: string) => ["clearpath", "resource", path] as const,
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: LIVE_REFRESH_MS,
        gcTime: 5 * 60_000,
        refetchIntervalInBackground: false,
        retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
      // A decision or revision is never automatically submitted twice.
      mutations: { retry: false },
    },
  });
}

/** Refresh active workspace views; invalidate inactive pages for the next visit. */
export async function invalidateWorkspaceQueries(client: QueryClient) {
  const filters: Parameters<QueryClient["invalidateQueries"]>[0] = {
    predicate: ({ queryKey }) => queryKey[0] === "clearpath" && (
      queryKey[1] === "dashboard" ||
      (queryKey[1] === "resource" && typeof queryKey[2] === "string" &&
        (queryKey[2].startsWith("/cases/") || queryKey[2] === "/decisions"))
    ),
  };
  // Also cancel inactive reads: an older full response must not repopulate a
  // summary and mark it fresh after a successful write invalidates it.
  await client.cancelQueries(filters);
  return client.invalidateQueries(filters);
}
