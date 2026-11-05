"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { errorMessage } from "./api";
import { resourceQueryOptions, replaceResource } from "./resource-query";

export function useResource<T>(path: string, options: { refetchInterval?: number | false } = {}) {
  const client = useQueryClient();
  const query = useQuery({
    ...resourceQueryOptions<T>(path),
    ...options,
  });

  return {
    data: query.data ?? null,
    error: query.error ? errorMessage(query.error) : "",
    // Background refreshes keep the content mounted, including forms and scroll anchors.
    loading: query.isPending,
    refreshing: query.isFetching,
    reload: () => { void query.refetch(); },
    replace: (data: T) => { replaceResource(client, path, data); },
  };
}
