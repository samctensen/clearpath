import { strict as assert } from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { dashboardQuerySchema, fixReasonDefinitions, type Analysis, type CaseStatus, type DashboardResponse, type SubmissionInput } from "@clearpath/contracts";
import { Store } from "./mod.ts";

const input: SubmissionInput = {
  title: "Pattern fixture", productId: "card", offerId: null, content: "Fictional copy for review.",
  format: "email", publisher: "Fixture studio", launchDate: "2026-12-01", completeAsset: true,
  linksToApplication: null, substantiation: "",
};
const check = (ruleId: string, status = "unknown") => ({ ruleId, status, title: ruleId,
  severity: "info", kind: "missing_information", explanation: "Provide details.",
  reference: { label: "Policy", type: "company_policy" } });
const analysis = (checks: unknown[] = []) => ({ checks, policyVersion: "fixture", offerVersion: null, scope: "fixture" });
const requestItem = (sourceId: string, source = "check") => ({ source, sourceId, title: "Recorded correction", nextStep: "Correct the copy." });
const counts = (response: DashboardResponse) => Object.fromEntries(response.fixPatterns!.reasons.filter((item) => item.count > 0).map((item) => [item.id, item.count]));

async function fixture() {
  const client = await PGlite.create("memory://");
  for (const file of ["001_initial.sql", "002_ai_reviews.sql", "003_soft_delete_cases.sql", "004_queue_paging.sql", "005_change_request_feedback.sql"]) {
    await client.exec(await Deno.readTextFile(new URL(`./migrations/${file}`, import.meta.url)));
  }
  const calls: { sql: string; params: unknown[] }[] = [];
  type DB = ConstructorParameters<typeof Store>[0];
  const wrap = (db: any): DB => ({
    query: async (sql, params = []) => { calls.push({ sql, params }); return (await db.query(sql, params)).rows; },
    transaction: async (fn) => db.transaction((tx: any) => fn(wrap(tx))), close: async () => {},
  });
  const store = new Store(wrap(client), "pglite");
  await client.query("INSERT INTO workspaces(id) VALUES ('fixture'), ('foreign')");
  let sequence = 0;
  async function add(id: string, status: CaseStatus, checks: unknown[] = [], options: { workspace?: string; revision?: number; title?: string; productId?: string; launchDate?: string; deleted?: boolean } = {}) {
    const revision = options.revision ?? 1;
    const created = new Date(Date.UTC(2026, 10, 1, 0, 0, sequence++)).toISOString();
    await client.query("INSERT INTO cases(id,workspace_id,status,revision,created_at,deleted_at) VALUES ($1,$2,$3,$4,$5,$6)", [id, options.workspace ?? "fixture", status, revision, created, options.deleted ? created : null]);
    await client.query("INSERT INTO revisions(id,case_id,number,input,analysis,content_hash) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,'fixture')", [`${id}-revision`, id, revision, JSON.stringify({ ...input, title: options.title ?? id, productId: options.productId ?? "card", launchDate: options.launchDate ?? input.launchDate }), JSON.stringify(analysis(checks))]);
  }
  async function event(id: string, feedback: unknown, message = "Recorded reviewer feedback", revision = 1) {
    await client.query("INSERT INTO events(id,case_id,type,actor,message,revision,change_request) VALUES ($1,$2,'changes_requested','reviewer',$3,$4,$5::jsonb)", [crypto.randomUUID(), id, message, revision, feedback === undefined ? null : JSON.stringify(feedback)]);
  }
  const dashboard = (query: Record<string, unknown> = {}) => store.dashboard("fixture", dashboardQuerySchema.parse({ role: "submitter", ...query }));
  return { client, store, calls, add, event, dashboard };
}

Deno.test("fix patterns count current distinct cases, overlap and honest legacy or unavailable sources", async () => {
  const f = await fixture();
  try {
    await f.add("missing", "needs_information", [check("review-context"), check("review-context"), check("offer-match"), check("approval-claims", "finding")]);
    await f.add("structured", "changes_requested", [check("approval-claims", "finding")]);
    await f.event("structured", { note: "Also add lender context.", items: [requestItem("offer-match"), requestItem("offer-match"), requestItem("loan-repayment"), requestItem("manual-1", "manual")] });
    await f.add("legacy", "changes_requested", [check("approval-claims", "finding")]);
    await f.event("legacy", undefined, "offer-match: historical wording must stay unclassified");
    await f.add("manual", "changes_requested");
    await f.event("manual", { note: "", items: [requestItem("manual-2", "manual")] });
    await f.add("freeform", "changes_requested");
    await f.event("freeform", { note: "Please clarify the lender.", items: [] });
    await f.add("unknown-request", "changes_requested");
    await f.event("unknown-request", { note: "", items: [requestItem("unknown-rule")] });
    await f.add("unknown-check", "needs_information", [check("unknown-rule"), check("review-context")]);
    await f.add("missing-checks", "needs_information");
    await f.add("missing-event", "changes_requested");
    await f.add("empty-request", "changes_requested");
    await f.event("empty-request", { note: " \t\n", items: [] }, "");
    await f.add("awaiting", "ready_for_review", [check("offer-match", "finding")]);
    await f.event("awaiting", { note: "Old request", items: [requestItem("offer-match")] });
    await f.client.query("INSERT INTO manual_findings(id,case_id,title,quote,reason,status) VALUES ('open-manual','awaiting','Concern','','Please change','open')");
    await f.add("approved", "approved");
    await f.event("approved", { note: "Old request", items: [requestItem("offer-match")] });
    await f.add("deleted", "needs_information", [check("review-context")], { deleted: true });
    await f.add("foreign", "needs_information", [check("review-context")], { workspace: "foreign" });
    const result = await f.dashboard();
    assert.equal(result.fixPatterns!.total, 10);
    assert.deepEqual(counts(result), { other_feedback: 5, details_unavailable: 4, "missing:review-context": 2, "missing:offer-match": 1, "request:offer-match": 1, "request:loan-repayment": 1 });
    assert.equal(result.submitterAttention, null);
    assert.ok(result.fixPatterns!.reasons.every((reason) => fixReasonDefinitions.some((definition) => definition.id === reason.id && definition.label === reason.label)));
    for (const reason of result.fixPatterns!.reasons) {
      const filtered = await f.dashboard({ view: "needs_attention", reason: reason.id, limit: 100 });
      assert.equal(filtered.page.total, reason.count, reason.id);
      assert.equal(filtered.rows.length, reason.count, reason.id);
      assert.deepEqual(filtered.fixPatterns, result.fixPatterns);
    }
  } finally { await f.client.close(); }
});

Deno.test("fix patterns use the latest request on the current revision and refresh after resubmission", async () => {
  const f = await fixture();
  try {
    await f.add("latest", "changes_requested", [], { revision: 2 });
    await f.event("latest", { note: "", items: [requestItem("approval-claims")] }, "Earlier revision", 1);
    await f.event("latest", { note: "", items: [requestItem("offer-match")] }, "Earlier current request", 2);
    await f.event("latest", { note: "", items: [requestItem("loan-repayment")] }, "Latest current request", 2);
    await f.add("stale-only", "changes_requested", [], { revision: 2 });
    await f.event("stale-only", { note: "", items: [requestItem("offer-match")] }, "Earlier revision", 1);
    assert.deepEqual(counts(await f.dashboard()), { "request:loan-repayment": 1, details_unavailable: 1 });
    const revised = await f.store.revise("fixture", "latest", 2, input, analysis([check("review-context")]) as Analysis);
    assert.ok(revised.ok);
    assert.equal(revised.value.case.status, "needs_information");
    assert.deepEqual(counts(await f.dashboard()), { "missing:review-context": 1, details_unavailable: 1 });
  } finally { await f.client.close(); }
});

Deno.test("inconsistent feedback stays accessible alongside classified portions", async () => {
  const f = await fixture();
  try {
    await f.add("missing-note", "changes_requested");
    await f.event("missing-note", { items: [requestItem("offer-match")] }, "Original audit feedback");
    await f.add("missing-items", "changes_requested");
    await f.event("missing-items", { note: "Keep this note visible." }, "Original note feedback");
    const result = await f.dashboard({ limit: 100 });
    assert.equal(result.fixPatterns!.total, 2);
    assert.deepEqual(counts(result), { details_unavailable: 2, "request:offer-match": 1, other_feedback: 1 });
    assert.equal(result.rows.find((row) => row.id === "missing-note")!.guidance!.text, "Original audit feedback");
    assert.equal(result.rows.find((row) => row.id === "missing-items")!.guidance!.text, "Original note feedback");
    const unavailable = await f.dashboard({ view: "needs_attention", reason: "details_unavailable" });
    assert.equal(unavailable.page.total, 2);
    assert.deepEqual(unavailable.fixPatterns, result.fixPatterns);
  } finally { await f.client.close(); }
});

Deno.test("unavailable check arrays remain retrievable through the matching reason filter", async () => {
  const f = await fixture();
  try {
    const invalidChecks = [null, { status: "unknown", ruleId: "review-context" }, "unavailable", 12, false];
    for (const [index, value] of invalidChecks.entries()) {
      const id = `invalid-checks-${index}`;
      await f.add(id, "needs_information");
      await f.client.query("UPDATE revisions SET analysis=jsonb_set(analysis, '{checks}', $2::jsonb) WHERE case_id=$1", [id, JSON.stringify(value)]);
    }
    // A tab without attention rows still exposes their cohort-wide fallback.
    const aggregate = await f.dashboard({ view: "approved" });
    assert.equal(aggregate.rows.length, 0);
    assert.equal(aggregate.fixPatterns!.total, invalidChecks.length);
    assert.deepEqual(counts(aggregate), { details_unavailable: invalidChecks.length });
    const selected = await f.dashboard({ view: "needs_attention", reason: "details_unavailable" });
    assert.deepEqual(selected.fixPatterns, aggregate.fixPatterns);
    assert.equal(selected.page.total, invalidChecks.length);
    assert.equal(selected.rows.length, invalidChecks.length);
    assert.deepEqual(selected.rows.map((row) => row.id), invalidChecks.map((_, index) => `invalid-checks-${index}`));
    for (const row of selected.rows) {
      assert.equal(row.status, "needs_information");
      assert.equal(row.findings, 0);
      assert.equal(row.unknowns, 0);
      assert.equal(row.guidance, null, "unavailable data must not invent an explanation");
    }
    const page = await f.dashboard({ view: "needs_attention", reason: "details_unavailable", scope: "page", limit: 2 });
    assert.equal(page.fixPatterns, null);
    assert.equal(page.page.total, invalidChecks.length);
    assert.deepEqual(page.rows.map((row) => row.id), selected.rows.slice(0, 2).map((row) => row.id));
  } finally { await f.client.close(); }
});

Deno.test("reason queries preserve search/product cohorts, keyset pages and page-only guidance cost", async () => {
  const f = await fixture();
  try {
    for (let i = 0; i < 17; i++) {
      const id = `case-${String(i).padStart(2, "0")}`;
      await f.add(id, "changes_requested", [], { title: `${i < 12 ? "Literal %_" : "Literal XY"} ${id}`, productId: i < 10 || i >= 12 ? "card" : "mortgage", launchDate: i < 6 ? "2026-12-01" : "2026-12-02" });
      await f.event(id, { note: "", items: [requestItem(i % 2 ? "offer-match" : "loan-repayment")] });
    }
    const base = { view: "needs_attention", reason: "request:offer-match", q: "%_", product: "card", limit: 2 };
    const full = await f.dashboard(base);
    assert.deepEqual(counts(full), { "request:offer-match": 5, "request:loan-repayment": 5 });
    assert.equal(full.fixPatterns!.total, 10);
    assert.equal(full.page.total, 5);
    for (const direction of ["asc", "desc"] as const) {
      const seen: string[] = [];
      let after: string | undefined;
      let previous: DashboardResponse | undefined;
      do {
        f.calls.length = 0;
        const page = await f.dashboard({ ...base, direction, scope: "page", after });
        assert.equal(page.fixPatterns, null);
        assert.equal(page.cohort, null);
        assert.equal(page.page.total, 5);
        assert.equal(page.page.from, seen.length + 1);
        assert.equal(f.calls.length, 2, "one queue query and one batched page guidance query");
        assert.deepEqual(JSON.parse(f.calls[1].params[1] as string), page.rows.map((row) => row.id), "no off-page attention rows are hydrated");
        if (previous) {
          const back = await f.dashboard({ ...base, direction, scope: "page", before: page.page.startCursor });
          assert.deepEqual(back.rows.map((row) => row.id), previous.rows.map((row) => row.id));
        }
        seen.push(...page.rows.map((row) => row.id));
        previous = page;
        after = page.page.hasNext ? page.page.endCursor! : undefined;
      } while (after);
      assert.deepEqual(seen, (direction === "asc" ? [1, 3, 5, 7, 9] : [7, 9, 1, 3, 5]).map((i) => `case-${String(i).padStart(2, "0")}`));
    }
    const tab = await f.dashboard({ q: "%_", product: "card", view: "approved", direction: "desc" });
    assert.deepEqual(tab.fixPatterns, full.fixPatterns, "chart ignores table view, reason, direction and page");
    const none = await f.dashboard({ q: "not-present" });
    assert.equal(none.fixPatterns!.total, 0);
    assert.deepEqual(counts(none), {});
    f.calls.length = 0;
    const reviewer = await f.dashboard({ role: "reviewer" });
    assert.equal(reviewer.fixPatterns, null);
    assert.equal(f.calls.length, 1);
    assert.ok(!f.calls[0].sql.includes("fix_memberships"), "reviewers do not scan reason sources");
    f.calls.length = 0;
    await f.dashboard({ scope: "page" });
    assert.ok(!f.calls[0].sql.includes("fix_memberships"), "unfiltered page requests skip chart work");
  } finally { await f.client.close(); }
});
