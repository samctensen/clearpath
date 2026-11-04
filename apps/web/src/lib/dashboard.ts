import type { CaseStatus, CaseSummary, DemoRole, ProductId, QueueCohortItem, SubmitterView } from "@clearpath/contracts";

export type DashboardStatus = CaseStatus | "all";
export type DashboardFilters = {
  status: DashboardStatus;
  view: SubmitterView;
  product: ProductId | "all";
  search: string;
  sort: "asc" | "desc";
};

export const dashboardStatuses: CaseStatus[] = [
  "ready_for_review",
  "needs_information",
  "changes_requested",
  "approved",
];

export const defaultDashboardFilters: DashboardFilters = {
  status: "all",
  view: "all",
  product: "all",
  search: "",
  sort: "asc",
};

const dashboardProducts: ProductId[] = ["card", "personal_loan", "mortgage", "unknown"];

export const dashboardFilterStorageKey = (role: DemoRole) => `clearpath-dashboard-filters-v2-${role}`;

export function parseDashboardFilters(value: unknown, role: DemoRole = "reviewer"): DashboardFilters {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...defaultDashboardFilters };
  }
  const saved = value as Record<string, unknown>;
  return {
    status: role === "submitter" ? "all" : saved.status === "all" || dashboardStatuses.includes(saved.status as CaseStatus)
      ? saved.status as DashboardStatus
      : defaultDashboardFilters.status,
    view: role === "submitter" && ["all", "needs_attention", "awaiting_review", "approved"].includes(String(saved.view)) ? saved.view as SubmitterView : "all",
    product: saved.product === "all" || dashboardProducts.includes(saved.product as ProductId)
      ? saved.product as DashboardFilters["product"]
      : defaultDashboardFilters.product,
    search: typeof saved.search === "string" ? saved.search.slice(0, 200) : defaultDashboardFilters.search,
    sort: saved.sort === "asc" || saved.sort === "desc" ? saved.sort : defaultDashboardFilters.sort,
  };
}

/** How many queue rows one page holds. The API caps this; the client never pages wider. */
export const queuePageSize = 10;

/** Where the queue is paged to. Both null means the first page. */
export type QueuePosition = { after: string | null; before: string | null };
export const firstQueuePage: QueuePosition = { after: null, before: null };

/**
 * Queue ordering and paging live on the API; separate keys keep unchanged map data mounted.
 * `scope: "page"` tells the API to skip the cohort and overview a caller already holds.
 */
export function dashboardRequest(
  filters: DashboardFilters,
  role: DemoRole,
  today: string,
  position: QueuePosition = firstQueuePage,
  scope: "full" | "page" = "full",
) {
  const q = filters.search.trim();
  const params = new URLSearchParams({
    q,
    product: filters.product,
    status: role === "submitter" && filters.view !== "all" ? "all" : filters.status,
    view: role === "submitter" ? filters.view : "all",
    sort: "launchDate",
    direction: filters.sort,
    role,
    today,
    limit: String(queuePageSize),
    scope,
  });
  if (position.after) params.set("after", position.after);
  if (position.before) params.set("before", position.before);
  const cohortKey = JSON.stringify([q, filters.product]);
  return {
    path: `/dashboard?${params}`,
    cohortKey,
    overviewKey: JSON.stringify([cohortKey, role, today]),
  };
}
export function dashboardCohort(
  cases: readonly CaseSummary[],
  filters: DashboardFilters,
): CaseSummary[] {
  const search = filters.search.trim().toLowerCase();
  return cases.filter((item) =>
    (filters.product === "all" || item.productId === filters.product) &&
    `${item.title} ${item.publisher}`.toLowerCase().includes(search)
  );
}

// Compare calendar strings directly, so the caller's local today never shifts through UTC.
// Round-trip validation rejects dates that Date.parse would silently normalize (e.g. Feb 30).
function calendarDay(value: string): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
    ? value
    : null;
}

function creationTime(value: string): number | null {
  if (typeof value !== "string" || !calendarDay(value.slice(0, 10))) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareKnown<T extends string | number>(
  left: T | null,
  right: T | null,
  direction = 1,
): number {
  if (left === null) return right === null ? 0 : 1;
  if (right === null) return -1;
  return left < right ? -direction : left > right ? direction : 0;
}

/** The ordering keys every queue view shares, and all the slim cohort carries. */
type OrderedCase = Pick<QueueCohortItem, "launchDate" | "createdAt" | "id">;

export function compareCases<T extends OrderedCase>(left: T, right: T, sort: "asc" | "desc"): number {
  return compareKnown(
    calendarDay(left.launchDate),
    calendarDay(right.launchDate),
    sort === "asc" ? 1 : -1,
  ) ||
    compareKnown(creationTime(left.createdAt), creationTime(right.createdAt)) ||
    compareKnown(left.id, right.id);
}

export function dashboardRows(
  cases: readonly CaseSummary[],
  filters: DashboardFilters,
): CaseSummary[] {
  return dashboardCohort(cases, filters)
    .filter((item) => filters.status === "all" || item.status === filters.status)
    .sort((left, right) => compareCases(left, right, filters.sort));
}

export function buildDashboard(cases: readonly CaseSummary[], role: DemoRole, today: string): {
  total: number;
  openCount: number;
  counts: Record<CaseStatus, number>;
  actionable: CaseSummary[];
  nextLaunchDate: string | null;
  overdueCount: number;
} {
  const counts: Record<CaseStatus, number> = {
    ready_for_review: 0,
    needs_information: 0,
    changes_requested: 0,
    approved: 0,
  };
  const currentDay = calendarDay(today);
  let nextLaunchDate: string | null = null;
  let overdueCount = 0;

  for (const item of cases) {
    counts[item.status] += 1;
    if (item.status === "approved") continue;
    const launchDay = calendarDay(item.launchDate);
    if (launchDay === null) continue;
    if (nextLaunchDate === null || launchDay < nextLaunchDate) nextLaunchDate = launchDay;
    if (currentDay !== null && launchDay < currentDay) overdueCount += 1;
  }

  const actionableStatus = role === "reviewer" ? "ready_for_review" : "changes_requested";
  const actionable = cases
    .filter((item) => item.status === actionableStatus || item.status === "needs_information")
    .sort((left, right) => compareCases(left, right, "asc"))
    .slice(0, 3);

  return {
    total: cases.length,
    openCount: cases.length - counts.approved,
    counts,
    actionable,
    nextLaunchDate,
    overdueCount,
  };
}
