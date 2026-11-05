import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import {
  QueryObserver,
  type QueryClient,
  type QueryKey,
  type QueryObserverOptions,
  type QueryObserverResult,
} from "@tanstack/react-query";
import type { DashboardResponse, DashboardRow } from "@clearpath/contracts";
import { dashboardRequest, defaultDashboardFilters } from "../src/lib/dashboard.ts";
import {
  dashboardQueryOptions,
  dashboardSummaryKey,
  type DashboardSummary,
} from "../src/lib/dashboard-query.ts";
import { createQueryClient, invalidateWorkspaceQueries, LIVE_REFRESH_MS, queryKeys } from "../src/lib/query-client.ts";
import { replaceResource, resourceQueryOptions } from "../src/lib/resource-query.ts";

const today = "2026-11-04";
const filters = { ...defaultDashboardFilters };

function row(id: string): DashboardRow {
  return {
    id,
    title: `Submission ${id}`,
    productId: "card",
    publisher: "Example affiliate",
    format: "email",
    status: "needs_information",
    launchDate: "2026-11-10",
    createdAt: "2026-11-01T12:00:00Z",
    updatedAt: "2026-11-01T12:00:00Z",
    revision: 1,
    findings: 0,
    unknowns: 1,
    guidance: null,
  };
}

function dashboardData(ids: string[], displayedIds = ids): DashboardResponse {
  const rows = displayedIds.map(row);
  const cohort = ids.map(id => {
    const { title, status, launchDate, createdAt } = row(id);
    return { id, title, status, launchDate, createdAt };
  });
  return {
    rows,
    submitterAttention: null,
    fixPatterns: null,
    page: {
      total: ids.length,
      from: rows.length ? ids.indexOf(displayedIds[0]) + 1 : 0,
      to: rows.length ? ids.indexOf(displayedIds.at(-1)!) + 1 : 0,
      hasPrev: rows.length > 0 && displayedIds[0] !== ids[0],
      hasNext: rows.length > 0 && displayedIds.at(-1) !== ids.at(-1),
      startCursor: displayedIds[0] ?? null,
      endCursor: displayedIds.at(-1) ?? null,
    },
    cohort,
    workspaceTotal: ids.length,
    overview: {
      total: ids.length,
      openCount: ids.length,
      counts: { needs_information: ids.length, ready_for_review: 0, changes_requested: 0, approved: 0 },
      actionable: cohort.slice(0, 3),
      nextLaunchDate: ids.length ? "2026-11-10" : null,
      overdueCount: 0,
    },
  };
}

function pageOnly(data: DashboardResponse): DashboardResponse {
  return { ...data, cohort: null, overview: null, fixPatterns: null };
}

type PendingRequest = {
  url: URL;
  signal: AbortSignal;
  respond: (data: unknown, status?: number) => void;
};

// Control response order at the HTTP boundary, including servers that finish after cancellation.
function requests(t: TestContext) {
  const received: PendingRequest[] = [];
  const waiting: Array<(request: PendingRequest) => void> = [];
  let count = 0;
  t.mock.method(globalThis, "fetch", (input: string | URL | Request, init?: RequestInit) => {
    const signal = init?.signal;
    assert.ok(signal, "queries must pass their cancellation signal to fetch");
    count += 1;
    return new Promise<Response>(resolve => {
      const request: PendingRequest = {
        url: new URL(String(input), "http://clearpath.test"),
        signal,
        respond: (data, status = 200) => resolve(Response.json(data, { status })),
      };
      const receiver = waiting.shift();
      if (receiver) receiver(request);
      else received.push(request);
    });
  });
  return {
    next: () => {
      const request = received.shift();
      return request ? Promise.resolve(request) : new Promise<PendingRequest>(resolve => waiting.push(resolve));
    },
    count: () => count,
  };
}

function queryClient(t: TestContext) {
  const client = createQueryClient();
  // Keep the real retry policy; no wall-clock backoff or cache-collection timers in tests.
  client.setDefaultOptions({
    ...client.getDefaultOptions(),
    queries: { ...client.getDefaultOptions().queries, retryDelay: 0, gcTime: Infinity },
  });
  t.after(() => client.clear());
  return client;
}

function observe<T, TKey extends QueryKey>(t: TestContext, client: QueryClient, options: QueryObserverOptions<T, Error, T, T, TKey>) {
  const observer = new QueryObserver<T, Error, T, T, TKey>(client, options);
  const unsubscribe = observer.subscribe(() => {});
  t.after(unsubscribe);
  return observer;
}

function when<T, TKey extends QueryKey>(observer: QueryObserver<T, Error, T, T, TKey>, predicate: (result: QueryObserverResult<T>) => boolean) {
  if (predicate(observer.getCurrentResult())) return Promise.resolve(observer.getCurrentResult());
  return new Promise<QueryObserverResult<T>>(resolve => {
    const unsubscribe = observer.subscribe(result => {
      if (!predicate(result)) return;
      unsubscribe();
      resolve(result);
    });
  });
}

const settled = <T, TKey extends QueryKey>(observer: QueryObserver<T, Error, T, T, TKey>) => when(observer, result => result.fetchStatus === "idle");
const summaryKey = (role: "reviewer" | "submitter" = "reviewer") => {
  const { cohortKey, overviewKey } = dashboardRequest(filters, role, today);
  return dashboardSummaryKey(cohortKey, overviewKey);
};

test("a fresh page change fetches only rows and retains the full chart summary", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const observer = observe(t, client, dashboardQueryOptions(client, filters, "reviewer", today));
  const first = await http.next();
  assert.equal(first.url.searchParams.get("scope"), "full");
  first.respond(dashboardData(["case-1", "case-2"], ["case-1"]));
  await settled(observer);
  const summary = client.getQueryData<DashboardSummary>(summaryKey());
  assert.equal(summary?.overview.total, 2);

  observer.setOptions(dashboardQueryOptions(client, filters, "reviewer", today, { after: "case-1", before: null }));
  assert.equal(observer.getCurrentResult().data, undefined, "the next page must not display the preceding page's rows");
  const next = await http.next();
  assert.equal(next.url.searchParams.get("scope"), "page");
  assert.equal(next.url.searchParams.get("after"), "case-1");
  next.respond(pageOnly(dashboardData(["case-1", "case-2"], ["case-2"])));
  await settled(observer);

  assert.deepEqual(observer.getCurrentResult().data?.rows.map(item => item.id), ["case-2"]);
  assert.strictEqual(client.getQueryData(summaryKey()), summary);
});

test("refreshing a previously lean page also refreshes chart aggregates", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const observer = observe(t, client, dashboardQueryOptions(client, filters, "reviewer", today));
  (await http.next()).respond(dashboardData(["case-1", "case-2"], ["case-1"]));
  await settled(observer);
  observer.setOptions(dashboardQueryOptions(client, filters, "reviewer", today, { after: "case-1", before: null }));
  const page = await http.next();
  assert.equal(page.url.searchParams.get("scope"), "page");
  page.respond(pageOnly(dashboardData(["case-1", "case-2"], ["case-2"])));
  await settled(observer);

  // Focus, interval and explicit refreshes all rerun this existing query function.
  const refresh = observer.refetch();
  const background = await http.next();
  assert.equal(background.url.searchParams.get("scope"), "full");
  assert.deepEqual(observer.getCurrentResult().data?.rows.map(item => item.id), ["case-2"]);
  assert.equal(observer.getCurrentResult().isPending, false);
  background.respond(dashboardData(["case-1", "case-2", "case-3"], ["case-2", "case-3"]));
  await refresh;

  assert.equal(client.getQueryData<DashboardSummary>(summaryKey())?.overview.total, 3);
  assert.equal(client.getQueryData<DashboardSummary>(summaryKey())?.cohort.length, 3);
  assert.deepEqual(observer.getCurrentResult().data?.rows.map(item => item.id), ["case-2", "case-3"]);
});

test("table filters reuse summaries while search, product, role and day changes fetch their own summaries", { timeout: 4_000 }, async t => {
  const scenarios = [
    { name: "status", filters: { ...filters, status: "needs_information" as const }, role: "reviewer" as const, day: today, scope: "page", parameter: "status", value: "needs_information" },
    { name: "sort", filters: { ...filters, sort: "desc" as const }, role: "reviewer" as const, day: today, scope: "page", parameter: "direction", value: "desc" },
    { name: "search", filters: { ...filters, search: "mortgage" }, role: "reviewer" as const, day: today, scope: "full", parameter: "q", value: "mortgage" },
    { name: "product", filters: { ...filters, product: "card" as const }, role: "reviewer" as const, day: today, scope: "full", parameter: "product", value: "card" },
    { name: "role", filters, role: "submitter" as const, day: today, scope: "full", parameter: "role", value: "submitter" },
    { name: "day", filters, role: "reviewer" as const, day: "2026-11-05", scope: "full", parameter: "today", value: "2026-11-05" },
  ];
  for (const scenario of scenarios) {
    await t.test(scenario.name, async subtest => {
      const client = queryClient(subtest);
      const http = requests(subtest);
      const original = dashboardQueryOptions(client, filters, "reviewer", today);
      const observer = observe(subtest, client, original);
      (await http.next()).respond(dashboardData(["original"]));
      await settled(observer);

      observer.setOptions(dashboardQueryOptions(client, scenario.filters, scenario.role, scenario.day));
      assert.equal(observer.getCurrentResult().data, undefined);
      const request = await http.next();
      assert.equal(request.url.searchParams.get("scope"), scenario.scope);
      assert.equal(request.url.searchParams.get(scenario.parameter), scenario.value);
      request.respond(dashboardData(["changed"]));
      await settled(observer);

      assert.deepEqual(observer.getCurrentResult().data?.rows.map(item => item.id), ["changed"]);
      assert.deepEqual(client.getQueryData(original.queryKey)?.rows.map(item => item.id), ["original"]);
    });
  }
});

test("submitter reason changes retain fresh reason counts", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const attention = { ...filters, view: "needs_attention" as const };
  const observer = observe(t, client, dashboardQueryOptions(client, attention, "submitter", today));
  const data = dashboardData(["case-1", "case-2"]);
  data.submitterAttention = data.rows;
  data.fixPatterns = {
    total: 2,
    reasons: [{ id: "missing:review-context", label: "Submission details", description: "Missing details", source: "missing_information", count: 2 }],
  };
  (await http.next()).respond(data);
  await settled(observer);
  const summary = client.getQueryData<DashboardSummary>(summaryKey("submitter"));

  observer.setOptions(dashboardQueryOptions(client, { ...attention, reason: "missing:review-context" }, "submitter", today));
  assert.equal(observer.getCurrentResult().data, undefined);
  const reason = await http.next();
  assert.equal(reason.url.searchParams.get("scope"), "page");
  assert.equal(reason.url.searchParams.get("reason"), "missing:review-context");
  reason.respond(pageOnly(data));
  await settled(observer);

  assert.strictEqual(client.getQueryData(summaryKey("submitter")), summary);
  assert.equal(summary?.fixPatterns?.reasons[0].count, 2);
});

test("an expired summary forces a full fetch for a new page", { timeout: 2_000 }, async t => {
  let now = Date.parse("2026-11-04T12:00:00Z");
  t.mock.method(Date, "now", () => now);
  const client = queryClient(t);
  const http = requests(t);
  const observer = observe(t, client, dashboardQueryOptions(client, filters, "reviewer", today));
  (await http.next()).respond(dashboardData(["case-1", "case-2"], ["case-1"]));
  await settled(observer);
  now += LIVE_REFRESH_MS + 1;

  observer.setOptions(dashboardQueryOptions(client, filters, "reviewer", today, { after: "case-1", before: null }));
  const next = await http.next();
  assert.equal(next.url.searchParams.get("scope"), "full");
  next.respond(dashboardData(["case-1", "case-2", "case-3"], ["case-2", "case-3"]));
  await settled(observer);
  assert.equal(client.getQueryData<DashboardSummary>(summaryKey())?.overview.total, 3);
});

test("switching queries aborts the old request and a late response cannot overwrite shared summaries", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const original = dashboardQueryOptions(client, filters, "reviewer", today);
  const observer = observe(t, client, original);
  const stale = await http.next();

  observer.setOptions(dashboardQueryOptions(client, { ...filters, status: "needs_information" }, "reviewer", today));
  const current = await http.next();
  assert.equal(stale.signal.aborted, true);
  current.respond(dashboardData(["new-1", "new-2"]));
  await settled(observer);
  stale.respond(dashboardData(["outdated"]));
  await new Promise<void>(resolve => setImmediate(resolve));

  assert.deepEqual(observer.getCurrentResult().data?.rows.map(item => item.id), ["new-1", "new-2"]);
  assert.deepEqual(client.getQueryData<DashboardSummary>(summaryKey())?.cohort.map(item => item.id), ["new-1", "new-2"]);
  assert.equal(client.getQueryData(original.queryKey), undefined);
});

test("out-of-order active requests preserve the summary from the newer request", { timeout: 2_000 }, async t => {
  let now = Date.parse("2026-11-04T12:00:00Z");
  t.mock.method(Date, "now", () => now);
  const client = queryClient(t);
  const http = requests(t);
  const older = observe(t, client, dashboardQueryOptions(client, filters, "reviewer", today));
  const slow = await http.next();
  now += 1;
  const newer = observe(t, client, dashboardQueryOptions(client, { ...filters, status: "needs_information" }, "reviewer", today));
  const fast = await http.next();
  fast.respond(dashboardData(["new-1", "new-2"]));
  await settled(newer);
  slow.respond(dashboardData(["outdated"]));
  await settled(older);

  assert.equal(slow.signal.aborted, false, "both consumers remain active");
  assert.deepEqual(client.getQueryData<DashboardSummary>(summaryKey())?.cohort.map(item => item.id), ["new-1", "new-2"]);
});

test("a failed background refresh retains rows and chart data", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const observer = observe(t, client, dashboardQueryOptions(client, filters, "reviewer", today));
  (await http.next()).respond(dashboardData(["case-1"]));
  await settled(observer);
  const displayed = observer.getCurrentResult().data;
  const summary = client.getQueryData(summaryKey());

  const refresh = observer.refetch();
  (await http.next()).respond({ error: { message: "Temporarily unavailable" } }, 503);
  (await http.next()).respond({ error: { message: "Temporarily unavailable" } }, 503);
  await refresh;

  assert.equal(observer.getCurrentResult().isError, true);
  assert.equal(observer.getCurrentResult().isPending, false);
  assert.strictEqual(observer.getCurrentResult().data, displayed);
  assert.strictEqual(client.getQueryData(summaryKey()), summary);
  assert.equal(observer.getCurrentResult().error?.message, "Temporarily unavailable");
});

test("workspace invalidation refreshes active views and invalidates inactive cases while preserving reference data", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const dashboard = observe(t, client, dashboardQueryOptions(client, filters, "reviewer", today));
  (await http.next()).respond(dashboardData(["case-1"]));
  await settled(dashboard);

  const original = { revision: 1 };
  for (const path of ["/cases/active", "/cases/inactive", "/decisions", "/catalog", "/policies"]) {
    client.setQueryData(queryKeys.resource(path), original);
  }
  const activeCase = observe(t, client, resourceQueryOptions<{ revision: number }>("/cases/active"));
  const decisions = observe(t, client, resourceQueryOptions<{ revision: number }>("/decisions"));
  observe(t, client, resourceQueryOptions("/catalog"));
  observe(t, client, resourceQueryOptions("/policies"));

  const invalidated = invalidateWorkspaceQueries(client);
  for (let index = 0; index < 3; index += 1) {
    const request = await http.next();
    if (request.url.pathname === "/api/dashboard") {
      assert.equal(request.url.searchParams.get("scope"), "full");
      request.respond(dashboardData(["case-1", "case-2"]));
    } else {
      assert.ok(["/api/cases/active", "/api/decisions"].includes(request.url.pathname));
      request.respond({ revision: 2 });
    }
  }
  await invalidated;

  assert.equal(activeCase.getCurrentResult().data?.revision, 2);
  assert.equal(decisions.getCurrentResult().data?.revision, 2);
  assert.equal(client.getQueryData<DashboardSummary>(summaryKey())?.overview.total, 2);
  assert.equal(client.getQueryState(queryKeys.resource("/cases/inactive"))?.isInvalidated, true);
  for (const path of ["/catalog", "/policies"]) {
    assert.strictEqual(client.getQueryData(queryKeys.resource(path)), original);
    assert.equal(client.getQueryState(queryKeys.resource(path))?.isInvalidated, false);
  }
  assert.equal(http.count(), 4, "reference queries must not be refetched after a workspace write");
});

test("workspace invalidation cancels inactive reads so a pre-save summary cannot become fresh again", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const options = dashboardQueryOptions(client, filters, "reviewer", today);
  const first = client.fetchQuery(options);
  (await http.next()).respond(dashboardData(["case-1", "case-2"]));
  await first;

  // A query can still be fetching without a mounted observer (for example, a prefetch).
  const pending = client.fetchQuery({ ...options, staleTime: 0 }).catch(() => undefined);
  const beforeSave = await http.next();
  await invalidateWorkspaceQueries(client);
  assert.equal(beforeSave.signal.aborted, true);
  beforeSave.respond(dashboardData(["outdated"]));
  await pending;
  await new Promise<void>(resolve => setImmediate(resolve));

  assert.equal(client.getQueryState(summaryKey())?.isInvalidated, true);
  assert.deepEqual(client.getQueryData<DashboardSummary>(summaryKey())?.cohort.map(item => item.id), ["case-1", "case-2"]);
  const observer = observe(t, client, dashboardQueryOptions(client, filters, "reviewer", today, { after: "case-1", before: null }));
  const next = await http.next();
  assert.equal(next.url.searchParams.get("scope"), "full", "the next visit must obtain a post-save summary");
  next.respond(dashboardData(["case-1", "case-2", "case-3"], ["case-2", "case-3"]));
  await settled(observer);
  assert.equal(client.getQueryData<DashboardSummary>(summaryKey())?.overview.total, 3);
});

test("client errors finish without retrying the rejected request", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const observer = observe(t, client, resourceQueryOptions("/cases/missing"));
  (await http.next()).respond({ error: { message: "Submission not found" } }, 404);
  await settled(observer);

  assert.equal(observer.getCurrentResult().isError, true);
  assert.equal(observer.getCurrentResult().error?.message, "Submission not found");
  assert.equal(http.count(), 1);
});

test("replacing a saved resource cancels an older read before it can overwrite the save", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const observer = observe(t, client, resourceQueryOptions<{ revision: number }>("/cases/active"));
  (await http.next()).respond({ revision: 1 });
  await settled(observer);
  const refresh = observer.refetch();
  const stale = await http.next();

  replaceResource(client, "/cases/active", { revision: 3 });
  assert.equal(stale.signal.aborted, true);
  stale.respond({ revision: 2 });
  await refresh;
  await new Promise<void>(resolve => setImmediate(resolve));

  assert.deepEqual(observer.getCurrentResult().data, { revision: 3 });
  assert.deepEqual(client.getQueryData(queryKeys.resource("/cases/active")), { revision: 3 });
});
