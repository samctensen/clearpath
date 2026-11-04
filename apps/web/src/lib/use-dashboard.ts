"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardResponse, DemoRole } from "@clearpath/contracts";
import { api, errorMessage } from "./api";
import { dashboardRequest, type DashboardFilters } from "./dashboard";

type Snapshot = {
  requestKey: string;
  cohortKey: string;
  overviewKey: string;
  data: DashboardResponse;
};
type QueryState = {
  result: Snapshot | null;
  failure: { requestKey: string; message: string } | null;
};

/** Never expose rows for a different query; retain only the still-valid map/overview. */
export function useDashboard(filters: DashboardFilters, role: DemoRole, today: string, enabled: boolean) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<QueryState>({ result: null, failure: null });
  const previousSearch = useRef<string | null>(null);
  const { path, cohortKey, overviewKey } = dashboardRequest(filters, role, today);
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
          if (!controller.signal.aborted) {
            setState({ result: { requestKey, cohortKey, overviewKey, data }, failure: null });
          }
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
  const cohort = enabled && state.result?.cohortKey === cohortKey ? state.result.data.cohort : null;
  const overview = enabled && state.result?.overviewKey === overviewKey ? state.result.data.overview : null;

  return {
    rows: error ? null : current?.rows ?? null,
    workspaceTotal: current?.workspaceTotal ?? null,
    cohort,
    overview,
    loading: !current && !error,
    error,
    reload: () => setAttempt(value => value + 1),
  };
}
