"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DashboardOverview,
  DashboardResponse,
  FixPatternSummary,
  DemoRole,
  QueueCohortItem,
  QueuePage,
} from "@clearpath/contracts";
import { api, errorMessage } from "./api";
import { dashboardRequest, firstQueuePage, type DashboardFilters, type QueuePosition } from "./dashboard";

type Held<T> = { key: string; value: T } | null;
type Snapshot = { requestKey: string; data: DashboardResponse };
type QueryState = {
  result: Snapshot | null;
  failure: { requestKey: string; message: string } | null;
  cohort: Held<QueueCohortItem[]>;
  overview: Held<DashboardOverview>;
  fixPatterns: Held<FixPatternSummary>;
};

const emptyPage: QueuePage = {
  total: 0,
  from: 0,
  to: 0,
  hasPrev: false,
  hasNext: false,
  startCursor: null,
  endCursor: null,
};

/**
 * Never expose rows for a different query; retain only the still-valid map/overview.
 * Table-only changes ask the API for rows alone, since chart and counts cover the
 * search/product cohort. Mutations explicitly invalidate every held summary.
 */
export function useDashboard(
  filters: DashboardFilters,
  role: DemoRole,
  today: string,
  enabled: boolean,
  position: QueuePosition = firstQueuePage,
) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<QueryState>({
    result: null,
    failure: null,
    cohort: null,
    overview: null,
    fixPatterns: null,
  });
  const previousSearch = useRef<string | null>(null);
  const chosenScope = useRef<{ key: string; scope: "full" | "page" } | null>(null);

  const { path: fullPath, cohortKey, overviewKey } = dashboardRequest(filters, role, today, position);
  const held = state.cohort?.key === cohortKey && state.overview?.key === overviewKey && (role !== "submitter" || state.fixPatterns?.key === overviewKey);
  // Pin scope per query, so answering a full request cannot change its own URL.
  const scopeKey = JSON.stringify([fullPath, attempt]);
  if (chosenScope.current?.key !== scopeKey) {
    chosenScope.current = { key: scopeKey, scope: held ? "page" : "full" };
  }
  const { path } = dashboardRequest(filters, role, today, position, chosenScope.current.scope);
  const requestKey = `${attempt}:${path}`;
  const search = filters.search.trim();

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const delay = previousSearch.current !== null && previousSearch.current !== search ? 200 : 0;
    previousSearch.current = search;
    const timer = window.setTimeout(() => {
      api<DashboardResponse>(path, { signal: controller.signal })
        .then(data => {
          if (controller.signal.aborted) return;
          setState(current => ({
            result: { requestKey, data },
            failure: null,
            cohort: data.cohort ? { key: cohortKey, value: data.cohort } : current.cohort,
            overview: data.overview ? { key: overviewKey, value: data.overview } : current.overview,
            fixPatterns: data.fixPatterns ? { key: overviewKey, value: data.fixPatterns } : current.fixPatterns,
          }));
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setState(current => ({ ...current, failure: { requestKey, message: errorMessage(error) } }));
          }
        });
    }, delay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, path, requestKey, cohortKey, overviewKey, search]);

  const current = enabled && state.result?.requestKey === requestKey ? state.result.data : null;
  const error = enabled && state.failure?.requestKey === requestKey ? state.failure.message : "";

  return {
    rows: error ? null : current?.rows ?? null,
    page: current?.page ?? emptyPage,
    workspaceTotal: current?.workspaceTotal ?? null,
    // Retain only pagination geometry during loading; both controls stay disabled.
    hadPagination: Boolean(state.result?.data.page.hasPrev || state.result?.data.page.hasNext),
    hadReviewAction: Boolean(state.overview?.value.actionable.length),
    cohort: enabled && state.cohort?.key === cohortKey ? state.cohort.value : null,
    overview: enabled && state.overview?.key === overviewKey ? state.overview.value : null,
    fixPatterns: enabled && state.fixPatterns?.key === overviewKey ? state.fixPatterns.value : null,
    loading: !current && !error,
    error,
    reload: () => {
      setState(current => ({ ...current, cohort: null, overview: null, fixPatterns: null }));
      setAttempt(value => value + 1);
    },
  };
}
