import type { CaseSummary } from "@clearpath/contracts";
import {
  buildDashboard,
  dashboardCohort,
  dashboardRows,
  dashboardRequest,
  defaultDashboardFilters,
  parseDashboardFilters,
  dashboardFilterStorageKey,
} from "../apps/web/src/lib/dashboard.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function submission(id: string, overrides: Partial<CaseSummary> = {}): CaseSummary {
  return {
    id,
    title: `Campaign ${id}`,
    publisher: "Northstar",
    productId: "card",
    format: "email",
    launchDate: "2026-11-10",
    status: "ready_for_review",
    revision: 1,
    findings: 0,
    unknowns: 0,
    createdAt: "2026-11-01T12:00:00.000Z",
    updatedAt: "2026-11-02T12:00:00.000Z",
    ...overrides,
  };
}

const ids = (cases: CaseSummary[]) => cases.map((item) => item.id);

Deno.test("dashboard requests encode literal searches and send sorting to the API", () => {
  const request = dashboardRequest({ status: "approved", view: "all", product: "card", search: "  50% + A&B_  ", sort: "desc" }, "submitter", "2026-11-04");
  const url = new URL(request.path, "http://clearpath.test");
  assertEquals(url.pathname, "/dashboard");
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => { query[key] = value; });
  assertEquals(query, {
    q: "50% + A&B_", product: "card", status: "approved", view: "all", sort: "launchDate",
    direction: "desc", role: "submitter", today: "2026-11-04", limit: "10", scope: "full",
  });
});

Deno.test("queue cursors travel in the URL while the map and overview keys stay put", () => {
  const first = dashboardRequest(defaultDashboardFilters, "reviewer", "2026-11-04");
  const next = dashboardRequest(
    defaultDashboardFilters,
    "reviewer",
    "2026-11-04",
    { after: "cursor-two", before: null },
    "page",
  );
  const forward = new URL(next.path, "http://clearpath.test").searchParams;
  assertEquals(forward.get("after"), "cursor-two");
  assertEquals(forward.get("before"), null);
  assertEquals(forward.get("scope"), "page");
  assertEquals(forward.get("limit"), "10");
  assertEquals(first.path === next.path, false);
  // Walking pages must not invalidate the chart or the overview the client already holds.
  assertEquals(first.cohortKey, next.cohortKey);
  assertEquals(first.overviewKey, next.overviewKey);
  const back = dashboardRequest(
    defaultDashboardFilters,
    "reviewer",
    "2026-11-04",
    { after: null, before: "cursor-two" },
    "page",
  );
  const backward = new URL(back.path, "http://clearpath.test").searchParams;
  assertEquals(backward.get("before"), "cursor-two");
  assertEquals(backward.get("after"), null);
});

Deno.test("queue-only filters keep map identity while role and search invalidate the right data", () => {
  const base = dashboardRequest(defaultDashboardFilters, "reviewer", "2026-11-04");
  const queue = dashboardRequest({ ...defaultDashboardFilters, status: "approved", sort: "desc" }, "reviewer", "2026-11-04");
  assertEquals(base.path === queue.path, false);
  assertEquals(base.cohortKey, queue.cohortKey);
  assertEquals(base.overviewKey, queue.overviewKey);
  const role = dashboardRequest(defaultDashboardFilters, "submitter", "2026-11-04");
  assertEquals(base.cohortKey, role.cohortKey);
  assertEquals(base.overviewKey === role.overviewKey, false);
  const search = dashboardRequest({ ...defaultDashboardFilters, search: "Northstar" }, "reviewer", "2026-11-04");
  assertEquals(base.cohortKey === search.cohortKey, false);
  assertEquals(base.overviewKey === search.overviewKey, false);
  assertEquals(parseDashboardFilters({ search: "a".repeat(250) }).search.length, 200);
});

Deno.test("dashboard counts every status and excludes approved cases from open work", () => {
  const dashboard = buildDashboard(
    [
      submission("ready-1", { findings: 9 }),
      submission("ready-2", { unknowns: 7 }),
      submission("needs-info", { status: "needs_information" }),
      submission("changes", { status: "changes_requested" }),
      submission("approved", { status: "approved" }),
    ],
    "reviewer",
    "2026-11-03",
  );

  assertEquals(dashboard.total, 5);
  assertEquals(dashboard.openCount, 4);
  assertEquals(dashboard.counts, {
    ready_for_review: 2,
    needs_information: 1,
    changes_requested: 1,
    approved: 1,
  });
});

Deno.test("empty cohorts have real zeros and no next launch", () => {
  assertEquals(buildDashboard([], "reviewer", "2026-11-03"), {
    total: 0,
    openCount: 0,
    counts: {
      ready_for_review: 0,
      needs_information: 0,
      changes_requested: 0,
      approved: 0,
    },
    actionable: [],
    nextLaunchDate: null,
    overdueCount: 0,
  });
});

Deno.test("role changes select eligible work in launch order and cap Up next at three", () => {
  const cases = [
    submission("approved", { status: "approved", launchDate: "2026-10-01" }),
    submission("ready-later", { launchDate: "2026-11-09" }),
    submission("unknown", { launchDate: "" }),
    submission("changes", { status: "changes_requested", launchDate: "2026-11-01" }),
    submission("needs-early", { status: "needs_information", launchDate: "2026-11-02" }),
    submission("ready", { launchDate: "2026-11-03" }),
    submission("needs-later", { status: "needs_information", launchDate: "2026-11-04" }),
  ];

  assertEquals(ids(buildDashboard(cases, "reviewer", "2026-11-03").actionable), [
    "needs-early",
    "ready",
    "needs-later",
  ]);
  assertEquals(ids(buildDashboard(cases, "submitter", "2026-11-03").actionable), [
    "changes",
    "needs-early",
    "needs-later",
  ]);
  assertEquals(buildDashboard([cases[0]], "submitter", "2026-11-03").nextLaunchDate, null);
});

Deno.test("overdue uses calendar days: yesterday counts, today and tomorrow do not", () => {
  const dashboard = buildDashboard(
    [
      submission("past", { launchDate: "2026-11-02" }),
      submission("today", { launchDate: "2026-11-03" }),
      submission("future", { launchDate: "2026-11-04" }),
      submission("approved-past", { status: "approved", launchDate: "2026-10-01" }),
      submission("changes-past", { status: "changes_requested", launchDate: "2026-11-01" }),
    ],
    "reviewer",
    "2026-11-03",
  );

  assertEquals(dashboard.overdueCount, 2);
  assertEquals(dashboard.nextLaunchDate, "2026-11-01");
});

Deno.test("invalid and missing launch dates stay in work but never become date metrics", () => {
  const invalidDates = [
    "",
    "not a date",
    "2026-2-03",
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-01",
    "2026-11-00",
    "2026-11-32",
    "2026-11-03T00:00:00.000Z",
    "1900-02-29",
  ];
  const cases = invalidDates.map((launchDate, index) =>
    submission(`invalid-${index}`, { launchDate })
  );
  const dashboard = buildDashboard(cases, "reviewer", "2026-11-03");

  assertEquals(dashboard.total, invalidDates.length);
  assertEquals(dashboard.openCount, invalidDates.length);
  assertEquals(dashboard.actionable.length, 3);
  assertEquals(dashboard.overdueCount, 0);
  assertEquals(dashboard.nextLaunchDate, null);
});

Deno.test("leap days and year changes use real Gregorian calendar dates", () => {
  const leapDay = [submission("leap-day", { launchDate: "2000-02-29" })];
  assertEquals(buildDashboard(leapDay, "reviewer", "2000-02-29").overdueCount, 0);
  assertEquals(buildDashboard(leapDay, "reviewer", "2000-03-01").overdueCount, 1);
  assertEquals(buildDashboard(leapDay, "reviewer", "2000-03-01").nextLaunchDate, "2000-02-29");
  assertEquals(
    buildDashboard(
      [
        submission("new-year", { launchDate: "2026-12-31" }),
      ],
      "reviewer",
      "2027-01-01",
    ).overdueCount,
    1,
  );
});

Deno.test("an invalid today never fabricates overdue work", () => {
  const cases = [submission("past", { launchDate: "2026-01-01" })];
  for (const today of ["", "invalid", "2026-02-29", "2026-13-01"]) {
    const dashboard = buildDashboard(cases, "reviewer", today);
    assertEquals(dashboard.overdueCount, 0);
    assertEquals(dashboard.nextLaunchDate, "2026-01-01");
  }
});

Deno.test("search and product define the overview while status only narrows table rows", () => {
  const cases = [
    submission("match-ready", { title: "Summer offer" }),
    submission("match-approved", { publisher: "Summer Partners", status: "approved" }),
    submission("wrong-product", { title: "Summer offer", productId: "mortgage" }),
    submission("wrong-search", { title: "Winter offer" }),
  ];
  const filters = parseDashboardFilters({
    status: "approved",
    product: "card",
    search: "  SUMMER  ",
    sort: "asc",
  });
  const cohort = dashboardCohort(cases, filters);
  assertEquals(ids(cohort), ["match-ready", "match-approved"]);
  assertEquals(ids(dashboardRows(cases, filters)), ["match-approved"]);
  assertEquals(buildDashboard(cohort, "reviewer", "2026-11-03").total, 2);
  assertEquals(buildDashboard(cohort, "reviewer", "2026-11-03").counts.approved, 1);
});

Deno.test("both sort directions place unknown dates last and retain stable creation/id ties", () => {
  const cases = [
    submission("unknown-z", { launchDate: "bad" }),
    submission("same-z", { launchDate: "2026-11-05" }),
    submission("late", { launchDate: "2026-11-07" }),
    submission("same-a", { launchDate: "2026-11-05", updatedAt: "2030-01-01T00:00:00Z" }),
    submission("same-old", { launchDate: "2026-11-05", createdAt: "2026-10-31T23:00:00Z" }),
    submission("early", { launchDate: "2026-11-04" }),
    submission("unknown-a", { launchDate: "2026-04-31" }),
  ];
  assertEquals(ids(dashboardRows(cases, { ...defaultDashboardFilters, sort: "asc" })), [
    "early",
    "same-old",
    "same-a",
    "same-z",
    "late",
    "unknown-a",
    "unknown-z",
  ]);
  assertEquals(ids(dashboardRows(cases, { ...defaultDashboardFilters, sort: "desc" })), [
    "late",
    "same-old",
    "same-a",
    "same-z",
    "early",
    "unknown-a",
    "unknown-z",
  ]);
  assertEquals(ids(buildDashboard(cases, "reviewer", "2026-11-03").actionable), [
    "early",
    "same-old",
    "same-a",
  ]);
});

Deno.test("creation ties use timestamps and put missing or impossible creation dates last", () => {
  const cases = [
    submission("invalid-a", { createdAt: "" }),
    submission("offset-earlier", { createdAt: "2026-11-01T10:00:00+02:00" }),
    submission("utc-later", { createdAt: "2026-11-01T09:00:00Z" }),
    submission("invalid-b", { createdAt: "2026-02-30T10:00:00Z" }),
  ];
  assertEquals(ids(dashboardRows(cases, defaultDashboardFilters)), [
    "offset-earlier",
    "utc-later",
    "invalid-a",
    "invalid-b",
  ]);
});

Deno.test("invalid restored filters fall back field by field without losing valid choices", () => {
  const defaults = { status: "all", view: "all", product: "all", search: "", sort: "asc" };
  for (const invalid of [null, undefined, false, 7, "all", [], ["approved"]]) {
    assertEquals(parseDashboardFilters(invalid), defaults);
  }
  assertEquals(
    parseDashboardFilters({
      status: "closed",
      product: "cards",
      search: 3,
      sort: "newest",
    }),
    defaults,
  );
  assertEquals(
    parseDashboardFilters({
      status: "needs_information",
      product: "unknown",
      search: " Name ",
      sort: "desc",
    }),
    { status: "needs_information", view: "all", product: "unknown", search: " Name ", sort: "desc" },
  );
  assertEquals(
    parseDashboardFilters({
      status: "approved",
      product: null,
      search: "Northstar",
      sort: false,
    }),
    { status: "approved", view: "all", product: "all", search: "Northstar", sort: "asc" },
  );
});

Deno.test("deriving and sorting leave case arrays, case fields, and saved filters untouched", () => {
  const cases = Object.freeze([
    Object.freeze(submission("late", { launchDate: "2026-12-01" })),
    Object.freeze(submission("early", { launchDate: "2026-11-01" })),
  ]);
  const saved = Object.freeze({
    status: "all",
    product: "all",
    search: "  Campaign  ",
    sort: "asc",
  });
  const before = JSON.stringify({ cases, saved });
  const filters = parseDashboardFilters(saved);
  dashboardCohort(cases, filters);
  dashboardRows(cases, filters);
  buildDashboard(cases, "reviewer", "2026-11-03");
  assertEquals(JSON.stringify({ cases, saved }), before);

  const restored = parseDashboardFilters(null);
  restored.search = "changed";
  assertEquals(parseDashboardFilters(null).search, "");
  assertEquals(defaultDashboardFilters.search, "");
});

Deno.test("submitter grouped views travel to the server without contradictory status filters", () => {
  const filters = { ...defaultDashboardFilters, view: "needs_attention" as const, status: "approved" as const };
  const params = new URL(dashboardRequest(filters, "submitter", "2026-11-04").path, "http://clearpath.test").searchParams;
  assertEquals(params.get("view"), "needs_attention");
  assertEquals(params.get("status"), "all");
  const reviewer = new URL(dashboardRequest(filters, "reviewer", "2026-11-04").path, "http://clearpath.test").searchParams;
  assertEquals(reviewer.get("view"), "all");
  assertEquals(reviewer.get("status"), "approved");
});

Deno.test("role filter storage is independent and legacy filters cannot hide submitter work", () => {
  assertEquals(dashboardFilterStorageKey("reviewer") === dashboardFilterStorageKey("submitter"), false);
  assertEquals(parseDashboardFilters({ status: "approved", view: "needs_attention" }, "submitter").status, "all");
  assertEquals(parseDashboardFilters({ view: "needs_attention" }, "reviewer").view, "all");
  assertEquals(parseDashboardFilters({ status: "approved" }, "submitter").view, "all");
});
