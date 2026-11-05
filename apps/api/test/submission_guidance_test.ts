import { strict as assert } from "node:assert";
import { createTestStore } from "@clearpath/models";
import { analyze, offers, POLICY_VERSION } from "@clearpath/checks";
import { type DashboardResponse } from "@clearpath/contracts";
import { createApiServer } from "../src/server.ts";

Deno.test("submitter grouped views filter before counting and cursor pagination", async () => {
  const store = await createTestStore();
  const app = await createApiServer({ store, analyze, offers, policyVersion: POLICY_VERSION, seedCaseCount: 18 });
  try {
    for (const [view, statuses] of [
      ["needs_attention", ["changes_requested", "needs_information"]],
      ["awaiting_review", ["ready_for_review"]],
      ["approved", ["approved"]],
    ] as const) {
      const base = `/api/dashboard?role=submitter&view=${view}&limit=2`;
      const first = await app.inject({ method: "GET", url: base });
      assert.equal(first.statusCode, 200);
      const body = first.json<DashboardResponse>();
      assert.ok(body.rows.length > 0);
      assert.ok(body.rows.every((row) => (statuses as readonly string[]).includes(row.status)));
      assert.equal(body.page.total, body.cohort!.filter((row) => (statuses as readonly string[]).includes(row.status)).length);
      if (body.page.hasNext) {
        const next = (await app.inject({ method: "GET", url: `${base}&after=${encodeURIComponent(body.page.endCursor!)}` })).json<DashboardResponse>();
        assert.equal(next.page.from, 3);
        assert.ok(next.rows.every((row) => (statuses as readonly string[]).includes(row.status)));
        const back = (await app.inject({ method: "GET", url: `${base}&before=${encodeURIComponent(next.page.startCursor!)}` })).json<DashboardResponse>();
        assert.deepEqual(back.rows.map((row) => row.id), body.rows.map((row) => row.id));
      }
    }
    for (const query of ["role=reviewer&view=approved", "role=submitter&view=approved&status=approved"]) {
      assert.equal((await app.inject({ method: "GET", url: `/api/dashboard?${query}` })).statusCode, 400);
    }
  } finally { await app.close(); await store.close(); }
});

Deno.test("guidance follows current revisions and excludes deleted or foreign cases", async () => {
  const store = await createTestStore();
  const app = await createApiServer({ store, analyze, offers, policyVersion: POLICY_VERSION, seedCaseCount: 18 });
  try {
    const get = async (url: string) => (await app.inject({ method: "GET", url })).json<DashboardResponse>();
    const initial = await get("/api/dashboard?role=submitter&limit=100");
    const feedback = initial.rows.find((row) => row.status === "changes_requested")!;
    const missing = initial.rows.find((row) => row.status === "needs_information")!;
    const approved = initial.rows.find((row) => row.status === "approved")!;
    assert.equal(feedback.guidance?.kind, "reviewer_feedback");
    assert.equal(missing.guidance?.kind, "missing_information");
    assert.equal(approved.guidance?.kind, "approved_copy");
    assert.equal(approved.guidance?.revision, approved.revision);
    assert.equal(initial.submitterAttention, null);
    assert.equal(initial.fixPatterns!.total, initial.rows.filter((row) => row.status === "needs_information" || row.status === "changes_requested").length);
    const detail = (await app.inject({ method: "GET", url: `/api/cases/${feedback.id}` })).json();
    const revised = await app.inject({ method: "POST", url: `/api/cases/${feedback.id}/revisions`,
      headers: { "content-type": "application/json", "x-demo-role": "submitter" },
      payload: { expectedRevision: 1, input: detail.revisions[0].input } });
    assert.equal(revised.statusCode, 200);
    const after = await get("/api/dashboard?role=submitter&limit=100");
    const updated = after.rows.find((row) => row.id === feedback.id)!;
    assert.equal(updated.revision, 2);
    assert.notEqual(updated.guidance?.kind, "reviewer_feedback");
    assert.equal(updated.guidance?.revision, 2);
    const deleted = await app.inject({ method: "POST", url: `/api/cases/${feedback.id}/delete`,
      headers: { "content-type": "application/json", "x-demo-role": "submitter" }, payload: { expectedRevision: 2 } });
    assert.equal(deleted.statusCode, 200);
    assert.ok(!(await get("/api/dashboard?role=submitter&limit=100")).rows.some((row) => row.id === feedback.id));
    const reviewer = await get("/api/dashboard?role=reviewer");
    assert.equal(reviewer.submitterAttention, null);
    assert.ok(reviewer.rows.every((row) => row.guidance === null));
    assert.equal((await get("/api/dashboard?role=submitter&scope=page")).submitterAttention, null);
    const foreign = await store.createWorkspace();
    const { dashboardQuerySchema } = await import("@clearpath/contracts");
    const other = await store.dashboard(foreign, dashboardQuerySchema.parse({ role: "submitter" }));
    assert.deepEqual(other.rows, []);
    assert.equal(other.submitterAttention, null);
    assert.equal(other.fixPatterns!.total, 0);
  } finally { await app.close(); await store.close(); }
});

Deno.test("grouped paging preserves counts and ties with literal search, product and both directions", async () => {
  const { dashboardQuerySchema } = await import("@clearpath/contracts");
  const store = await createTestStore();
  try {
    const baseInput = { productId: "card" as const, offerId: null, content: "Some valid copy for testing.",
      format: "email" as const, publisher: "Fixture", launchDate: "2026-12-01", completeAsset: true,
      linksToApplication: null, substantiation: "" };
    const empty = { checks: [], policyVersion: "test", offerVersion: null, scope: "test" };
    const unknown = { ...empty, checks: [{ ruleId: "review-context", title: "Context", status: "unknown" as const,
      severity: "info" as const, kind: "missing_information" as const, explanation: "Provide context",
      reference: { label: "Context", type: "company_policy" as const } }] };
    const statuses = ["changes_requested", "ready_for_review", "needs_information", "approved"] as const;
    const fixture = Array.from({ length: 64 }, (_, i) => ({
      i, status: statuses[i % 4], title: `${i < 32 || i >= 48 ? "Literal %_" : "Literal XY"} ${String(i).padStart(2, "0")}`,
      productId: (i < 48 ? "card" : "mortgage") as "card" | "mortgage",
      date: i % 8 < 4 ? "2026-12-01" : "2026-12-02",
    }));
    const plans = fixture.map((f) => ({
      input: { ...baseInput, title: f.title, productId: f.productId, launchDate: f.date },
      analysis: f.status === "needs_information" ? unknown : empty,
      ...(f.status === "changes_requested" ? { decision: { decision: "request_changes" as const, note: "Revise", dispositions: [] } }
        : f.status === "approved" ? { decision: { decision: "approve" as const, note: "", dispositions: [] } } : {}),
    }));
    const seeded = await store.createSeededWorkspace(plans);
    assert.ok(seeded.ok);
    for (const direction of ["asc", "desc"] as const) {
      for (const [view, group] of [["needs_attention", ["changes_requested", "needs_information"]],
        ["awaiting_review", ["ready_for_review"]], ["approved", ["approved"]]] as const) {
        const expected = fixture.filter((f) => f.productId === "card" && f.title.includes("%_") &&
          (group as readonly string[]).includes(f.status)).sort((a, b) =>
            (direction === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.i - b.i);
        if (view === "needs_attention") assert.equal(expected.length, 16);
        const query = { role: "submitter", view, direction, product: "card", q: "%_", limit: 3 };
        let after: string | undefined;
        let previous: DashboardResponse | undefined;
        const seen: string[] = [];
        do {
          const page = await store.dashboard(seeded.value, dashboardQuerySchema.parse({ ...query, after }));
          assert.equal(page.page.total, expected.length);
          assert.equal(page.page.from, seen.length + 1);
          assert.equal(page.page.to, seen.length + page.rows.length);
          if (previous) {
            const back = await store.dashboard(seeded.value, dashboardQuerySchema.parse({ ...query, before: page.page.startCursor }));
            assert.deepEqual(back.rows.map((r) => r.id), previous.rows.map((r) => r.id));
          }
          seen.push(...page.rows.map((r) => r.title));
          previous = page;
          after = page.page.hasNext ? page.page.endCursor! : undefined;
        } while (after);
        assert.deepEqual(seen, expected.map((f) => f.title));
      }
    }
  } finally { await store.close(); }
});

Deno.test("guidance marks truncated Unicode text and missing sources stay null", async () => {
  const { dashboardQuerySchema } = await import("@clearpath/contracts");
  const store = await createTestStore();
  try {
    const input = { title: "Unicode feedback", productId: "card" as const, offerId: null,
      content: "Some valid copy for testing.", format: "email" as const, publisher: "Fixture",
      launchDate: "2026-12-01", completeAsset: true, linksToApplication: null, substantiation: "" };
    const empty = { checks: [], policyVersion: "test", offerVersion: null, scope: "test" };
    const missing = { ...empty, checks: [{ ruleId: "review-context", title: "Context", status: "unknown" as const,
      severity: "info" as const, kind: "missing_information" as const, explanation: "",
      reference: { label: "Context", type: "company_policy" as const } }] };
    const note = "😀".repeat(250);
    const seeded = await store.createSeededWorkspace([
      { input, analysis: empty, decision: { decision: "request_changes", note, dispositions: [] } },
      { input: { ...input, title: "Unavailable context" }, analysis: missing },
    ]);
    assert.ok(seeded.ok);
    const result = await store.dashboard(seeded.value, dashboardQuerySchema.parse({ role: "submitter" }));
    const feedback = result.rows.find((r) => r.title === "Unicode feedback")!;
    assert.equal(feedback.guidance?.text, `${"😀".repeat(239)}…`);
    assert.equal(feedback.guidance?.itemCount, 1);
    assert.equal(Array.from(feedback.guidance!.text).length, 240);
    const unavailable = result.rows.find((r) => r.title === "Unavailable context")!;
    assert.equal(unavailable.status, "needs_information");
    assert.equal(unavailable.guidance, null);
  } finally { await store.close(); }
});
