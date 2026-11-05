import { queryOptions, type QueryClient } from "@tanstack/react-query";
import type { DashboardOverview, DashboardResponse, DemoRole, FixPatternSummary, QueueCohortItem } from "@clearpath/contracts";
import { api } from "./api";
import { dashboardRequest, firstQueuePage, type DashboardFilters, type QueuePosition } from "./dashboard";
import { LIVE_REFRESH_MS, queryKeys } from "./query-client";

export type DashboardSummary = {
  cohort: QueueCohortItem[];
  overview: DashboardOverview;
  fixPatterns: FixPatternSummary | null;
  requestedAt: number;
};

export const dashboardSummaryKey = (cohortKey: string, overviewKey: string) =>
  [...queryKeys.dashboard, "summary", cohortKey, overviewKey] as const;

export function dashboardQueryOptions(
  client: QueryClient,
  filters: DashboardFilters,
  role: DemoRole,
  today: string,
  position: QueuePosition = firstQueuePage,
) {
  const request = dashboardRequest(filters, role, today, position);
  const queryKey = [...queryKeys.dashboard, "page", request.path] as const;
  const summaryKey = dashboardSummaryKey(request.cohortKey, request.overviewKey);

  return queryOptions({
    queryKey,
    staleTime: LIVE_REFRESH_MS,
    refetchInterval: LIVE_REFRESH_MS,
    queryFn: async ({ signal }) => {
      const requestedAt = Date.now();
      const summary = client.getQueryState<DashboardSummary>(summaryKey);
      const freshSummary = summary?.data && !summary.isInvalidated &&
        requestedAt - summary.dataUpdatedAt < LIVE_REFRESH_MS &&
        (role !== "submitter" || summary.data.fixPatterns !== null);
      // Only a new table view can reuse summaries. Polls and explicit refreshes
      // of an existing view always fetch the charts and overview with its rows.
      const scope = freshSummary && !client.getQueryData(queryKey) ? "page" : "full";
      const { path } = dashboardRequest(filters, role, today, position, scope);
      const data = await api<DashboardResponse>(path, { signal });
      signal.throwIfAborted();

      if (data.cohort && data.overview) {
        const nextSummary: DashboardSummary = {
          cohort: data.cohort,
          overview: data.overview,
          fixPatterns: data.fixPatterns,
          requestedAt,
        };
        client.setQueryData<DashboardSummary>(summaryKey, current =>
          current && current.requestedAt > requestedAt ? undefined : nextSummary
        );
      }
      return data;
    },
  });
}
