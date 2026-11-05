"use client";

import { useEffect, useRef, useState } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DemoRole, QueuePage } from "@clearpath/contracts";
import { errorMessage } from "./api";
import { dashboardRequest, firstQueuePage, type DashboardFilters, type QueuePosition } from "./dashboard";
import { dashboardQueryOptions, dashboardSummaryKey, type DashboardSummary } from "./dashboard-query";
import { invalidateWorkspaceQueries } from "./query-client";

const emptyPage: QueuePage = {
  total: 0,
  from: 0,
  to: 0,
  hasPrev: false,
  hasNext: false,
  startCursor: null,
  endCursor: null,
};

/** Keep only same-query rows during refreshes and reuse matching dashboard summaries. */
export function useDashboard(
  filters: DashboardFilters,
  role: DemoRole,
  today: string,
  enabled: boolean,
  position: QueuePosition = firstQueuePage,
) {
  const client = useQueryClient();
  const search = filters.search.trim();
  const [settledSearch, setSettledSearch] = useState(search);
  const previousGeometry = useRef({ pagination: false, reviewAction: false });

  useEffect(() => {
    if (settledSearch === search) return;
    const timer = window.setTimeout(() => setSettledSearch(search), 200);
    return () => window.clearTimeout(timer);
  }, [search, settledSearch]);

  // Change the key immediately, so typing never shows rows from the old search.
  // Debounce only the request; other filters and pagination remain immediate.
  const query = useQuery({
    ...dashboardQueryOptions(client, filters, role, today, position),
    enabled: enabled && search === settledSearch,
  });
  const { cohortKey, overviewKey } = dashboardRequest(filters, role, today, position);
  const summaryQuery = useQuery<DashboardSummary>({
    queryKey: dashboardSummaryKey(cohortKey, overviewKey),
    queryFn: skipToken,
  });
  const current = enabled ? query.data : undefined;
  const summary = summaryQuery.data;
  const error = enabled && query.error ? errorMessage(query.error) : "";

  useEffect(() => {
    if (current) previousGeometry.current.pagination = current.page.hasPrev || current.page.hasNext;
    if (summary) previousGeometry.current.reviewAction = summary.overview.actionable.length > 0;
  }, [current, summary]);

  return {
    rows: current?.rows ?? null,
    page: current?.page ?? emptyPage,
    workspaceTotal: current?.workspaceTotal ?? null,
    // Preserve layout geometry while a different query loads, without old rows.
    hadPagination: current ? current.page.hasPrev || current.page.hasNext : previousGeometry.current.pagination,
    hadReviewAction: summary ? summary.overview.actionable.length > 0 : previousGeometry.current.reviewAction,
    cohort: enabled ? summary?.cohort ?? null : null,
    overview: enabled ? summary?.overview ?? null : null,
    fixPatterns: enabled ? summary?.fixPatterns ?? null : null,
    loading: !current && !error,
    error,
    reload: () => { void invalidateWorkspaceQueries(client); },
  };
}
