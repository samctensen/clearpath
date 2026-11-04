import { strict as assert } from "node:assert";
import { encodeQueueCursor, type QueueCohortItem } from "@clearpath/contracts";
import { defaultDashboardFilters } from "../apps/web/src/lib/dashboard.ts";
import { emptyQueueRecovery, nextReviewInQueue, parseQueueContext, queueReturnScroll, readQueueContext, writeQueueContext, type QueueContext } from "../apps/web/src/lib/queue-context.ts";
const cursor = encodeQueueCursor({ key: "2026-11-04", createdAt: "2026-11-01T12:00:00Z", id: "last-on-page-one" });
const start = encodeQueueCursor({ key: "2026-11-05", createdAt: "2026-11-01T12:00:00Z", id: "first-on-page-two" });
const context = (): QueueContext => ({ version: 1, role: "reviewer", filters: { ...defaultDashboardFilters, product: "card", search: "Publisher", sort: "desc", status: "ready_for_review" }, position: { after: cursor, before: null }, pageStartCursor: start, selectedId: null, openedCaseId: "case", returnTo: { scrollY: 513, anchorId: "case", anchorTop: 281 } });
Deno.test("queue context preserves a page-two cursor, filters, order and exact return anchor", () => {
  assert.deepEqual(parseQueueContext(context(), "reviewer"), context());
});
Deno.test("queue context cannot leak between roles or accept ambiguous and malformed cursors", () => {
  assert.equal(parseQueueContext(context(), "submitter"), null);
  assert.equal(parseQueueContext({ ...context(), position: { after: cursor, before: start } }, "reviewer"), null);
  assert.equal(parseQueueContext({ ...context(), position: { after: "broken", before: null } }, "reviewer"), null);
  assert.equal(parseQueueContext({ ...context(), version: 2 }, "reviewer"), null);
});
Deno.test("invalid return geometry is discarded without losing valid filters and pagination", () => {
  const result = parseQueueContext({ ...context(), returnTo: { scrollY: -1, anchorId: "case", anchorTop: Infinity } }, "reviewer");
  assert.equal(result?.returnTo, null); assert.deepEqual(result?.position, context().position);
});
Deno.test("queue snapshots remain separate by role and unavailable storage stays optional", () => {
  const entries = new Map<string, string>();
  const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
  writeQueueContext(context(), storage);
  assert.deepEqual(readQueueContext("reviewer", storage), context());
  assert.equal(readQueueContext("submitter", storage), null);
  const denied = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); } };
  writeQueueContext(context(), denied); assert.equal(readQueueContext("reviewer", denied), null);
});
function item(id: string, status: QueueCohortItem["status"], launchDate: string): QueueCohortItem { return { id, status, title: id, launchDate, createdAt: "2026-11-01T12:00:00Z" }; }
Deno.test("next review uses fresh eligibility and saved order after the current case is approved", () => {
  const cohort = [item("first", "ready_for_review", "2026-11-01"), item("current", "approved", "2026-11-02"), item("finished", "changes_requested", "2026-11-03"), item("next", "needs_information", "2026-11-04")];
  assert.equal(nextReviewInQueue(cohort, defaultDashboardFilters, "current")?.id, "next");
  assert.equal(nextReviewInQueue(cohort, { ...defaultDashboardFilters, sort: "desc" }, "current")?.id, "first");
  assert.equal(nextReviewInQueue(cohort, { ...defaultDashboardFilters, status: "ready_for_review" }, "current")?.id, "first");
});
Deno.test("next review wraps to remaining eligible work but never crosses a status filter or repeats the current case", () => {
  const cohort = [item("first", "ready_for_review", "2026-11-01"), item("current", "ready_for_review", "2026-11-02")];
  assert.equal(nextReviewInQueue(cohort, defaultDashboardFilters, "current")?.id, "first");
  assert.equal(nextReviewInQueue(cohort, { ...defaultDashboardFilters, status: "needs_information" }, "current"), null);
  assert.equal(nextReviewInQueue([cohort[1]], defaultDashboardFilters, "current"), null);
  assert.equal(nextReviewInQueue([], defaultDashboardFilters, "current"), null);
});
Deno.test("an emptied final page recovers before its former first row rather than dropping the prior boundary item", () => {
  assert.deepEqual(emptyQueueRecovery({ after: cursor, before: null }, start), { after: null, before: start });
  assert.deepEqual(emptyQueueRecovery({ after: null, before: start }, cursor), { after: null, before: null });
  assert.deepEqual(emptyQueueRecovery({ after: cursor, before: null }, null), { after: null, before: null });
});
Deno.test("return scrolling tracks the saved row despite layout changes and falls back when it disappeared", () => {
  const saved = context().returnTo!;
  assert.equal(queueReturnScroll(saved, 900), 619);
  assert.equal(queueReturnScroll(saved), 513);
  assert.equal(queueReturnScroll(saved, 100), 0);
});

Deno.test("returning to a reason-filtered queue preserves membership, page and row geometry", () => {
  const saved = { ...context(), role: "submitter" as const, filters: { ...defaultDashboardFilters, view: "needs_attention" as const, reason: "missing:review-context", product: "card" as const } };
  const entries = new Map<string, string>();
  const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
  writeQueueContext(saved, storage);
  const restored = readQueueContext("submitter", storage);
  assert.deepEqual(restored, saved);
  // The new chart can change the hero's height; the opened row retains its viewport position.
  assert.equal(queueReturnScroll(restored!.returnTo!, 740), 459);
  assert.equal(queueReturnScroll(restored!.returnTo!), 513);
});

Deno.test("obsolete or incompatible saved reasons discard their old page and return position", () => {
  for (const [role, view, reason] of [
    ["submitter", "needs_attention", "missing:retired-rule"],
    ["submitter", "all", "other_feedback"],
    ["submitter", "approved", "request:offer-match"],
    ["reviewer", "needs_attention", "other_feedback"],
  ] as const) {
    const restored = parseQueueContext({ ...context(), role, filters: { ...defaultDashboardFilters, view, reason } }, role);
    assert.deepEqual(restored?.filters, { ...defaultDashboardFilters, view: role === "reviewer" ? "all" : view, reason: null });
    assert.deepEqual(restored?.position, { after: null, before: null });
    assert.equal(restored?.pageStartCursor, null);
    assert.equal(restored?.returnTo, null);
  }
});
