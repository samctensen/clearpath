import { queryOptions, type QueryClient } from "@tanstack/react-query";
import { api } from "./api.ts";
import { queryKeys } from "./query-client.ts";

export function resourceQueryOptions<T>(path: string) {
  return queryOptions({
    queryKey: queryKeys.resource(path),
    queryFn: ({ signal }) => api<T>(path, { signal }),
  });
}

export function replaceResource<T>(client: QueryClient, path: string, data: T) {
  const key = queryKeys.resource(path);
  // A GET started before a save must never win over that save's response.
  void client.cancelQueries({ queryKey: key, exact: true });
  return client.setQueryData<T>(key, data)!;
}
