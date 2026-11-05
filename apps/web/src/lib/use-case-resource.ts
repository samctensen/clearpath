"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaseDetail } from "@clearpath/contracts";
import { errorMessage } from "./api";
import { LIVE_REFRESH_MS } from "./query-client";
import { resourceQueryOptions, replaceResource } from "./resource-query";

/** Live activity is checked quietly, but the revision being edited/reviewed is pinned. */
export function useCaseResource(path: string) {
  const client = useQueryClient();
  const query = useQuery({
    ...resourceQueryOptions<CaseDetail>(path),
    refetchInterval: LIVE_REFRESH_MS,
  });
  const [snapshot, setSnapshot] = useState<{ path: string; data: CaseDetail } | null>(null);
  // A cached case may have been invalidated by a queue action. Validate it before
  // pinning the initial review, otherwise stale decision controls would appear.
  const fresh = !query.isStale && !query.isError ? query.data ?? null : null;
  const data = snapshot?.path === path ? snapshot.data : fresh;
  if (data && snapshot?.path !== path) setSnapshot({ path, data });

  function replace(updated: CaseDetail) {
    setSnapshot({ path, data: replaceResource(client, path, updated) });
  }

  return {
    data,
    loading: !data && !query.isError,
    refreshing: query.isFetching,
    error: query.error ? errorMessage(query.error) : "",
    hasUpdate: Boolean(data && query.data && data !== query.data),
    replace,
    reload: async () => {
      const result = await query.refetch();
      if (!result.data || result.error) return false;
      setSnapshot({ path, data: result.data });
      return true;
    },
  };
}
