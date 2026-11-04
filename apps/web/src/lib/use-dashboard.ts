"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DashboardOverview,
  DashboardResponse,
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
 * Walking to another page asks the API for rows alone, since the chart and the counts
 * cover the whole cohort and cannot change while only the cursor moves.
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
  });
  const previousSearch = useRef<string | null>(null);
  const chosenScope = useRef<{ key: string; scope: "full" | "page" } | null>(null);

  const { cohortKey, overviewKey } = dashboardRequest(filters, role, today, position);
  const paging = position.after !== null || position.before !== null;
  const held = state.cohort?.key === cohortKey && state.overview?.key === overviewKey;
  // Pin the scope per position, so answering a request can never change the next URL.
  const scopeKey = JSON.stringify([cohortKey, overviewKey, position, attempt]);
  if (chosenScope.current?.key !== scopeKey) {
    chosenScope.current = { key: scopeKey, scope: paging && held ? "page" : "full" };
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
    cohort: enabled && state.cohort?.key === cohortKey ? state.cohort.value : null,
    overview: enabled && state.overview?.key === overviewKey ? state.overview.value : null,
    loading: !current && !error,
    error,
    reload: () => setAttempt(value => value + 1),
  };
}
