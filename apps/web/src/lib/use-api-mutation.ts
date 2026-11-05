"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { invalidateWorkspaceQueries } from "./query-client";

type Request = { path: string; options: Parameters<typeof api>[1] };

/** Existing form guards own presentation; Query owns mutation/cache coordination. */
export function useApiMutation<T>() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ path, options }: Request) => api<T>(path, options),
    onSuccess: () => invalidateWorkspaceQueries(client),
  });
}
