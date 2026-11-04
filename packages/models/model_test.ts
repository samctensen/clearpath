import { strict as assert } from "node:assert";
import { createTestStore, Store } from "./mod.ts";
import { PGlite } from "@electric-sql/pglite";
import type { Analysis, SubmissionInput } from "@clearpath/contracts";

async function instrumentedStore() {
  const client = await PGlite.create("memory://");
  for (const file of ["001_initial.sql", "002_ai_reviews.sql", "003_soft_delete_cases.sql"]) {
    await client.exec(await Deno.readTextFile(new URL(`./migrations/${file}`, import.meta.url)));
  }
  const state = { queries: 0, failAfter: 0 };
  type TestDb = ConstructorParameters<typeof Store>[0];
  const wrap = (c: any): TestDb => ({
    query: async (sql, params = []) => {
      state.queries++;
      if (state.failAfter > 0 && --state.failAfter === 0) {
        throw new Error("injected storage failure");
      }
      return (await c.query(sql, params)).rows;
    },
    transaction: async (fn) => await c.transaction((tx: any) => fn(wrap(tx))),
    close: async () => {},
  });
  return {
    store: new Store({ ...wrap(client), close: async () => await client.close() }, "pglite"),
    client,
    state,
  };
}

const input: SubmissionInput = {
  title: "Example copy",
  productId: "card",
  offerId: "card",
  content: "Example credit card copy",
  format: "email",
  publisher: "Example",
  launchDate: "2026-11-03",
  completeAsset: true,
  linksToApplication: null,
  substantiation: "",
};
const analysis: Analysis = {
  checks: [{
    ruleId: "test",
    title: "Concern",
    status: "finding",
    severity: "medium",
    kind: "disclosure",
    explanation: "Review",
    reference: { label: "Policy", type: "company_policy" },
  }],
  policyVersion: "1",
  offerVersion: null,
  scope: "Text only",
};
Deno.test("review lifecycle persists revisions, guards approval and isolates workspaces", async () => {
  const store = await createTestStore();
  try {
    const workspace = await store.createWorkspace();
    const other = await store.createWorkspace();
    const created = await store.createCase(workspace, input, analysis);
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const id = created.value.case.id;
    assert.equal((await store.getCase(other, id)).ok, false);
    const blocked = await store.decide(workspace, id, 1, "approve", "");
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.error.code, "blocked");
    const empty = await store.disposition(workspace, id, 1, "test", "dismissed", "");
    assert.equal(empty.ok, false);
    const manual = await store.addManualFinding(
      workspace,
      id,
      1,
      "Manual concern",
      "copy",
      "Check this",
    );
    assert.equal(manual.ok, true);
    const revision = await store.revise(workspace, id, 1, input, analysis);
    assert.equal(revision.ok, true);
    if (!revision.ok) return;
    assert.equal(revision.value.case.revision, 2);
    assert.equal(revision.value.manualFindings[0].status, "open");
    const stale = await store.decide(workspace, id, 1, "request_changes", "Please revise");
    assert.equal(stale.ok, false);
    if (!stale.ok) assert.equal(stale.error.code, "conflict");
    const decision = await store.decide(workspace, id, 2, "request_changes", "Please revise");
    assert.equal(decision.ok, true);
    const repeated = await store.decide(workspace, id, 2, "request_changes", "Again");
    assert.equal(repeated.ok, false);
    if (!repeated.ok) assert.equal(repeated.error.code, "conflict");
  } finally {
    await store.close();
  }
});
Deno.test("approved revision is invalidated by revision and persists on reopen", async () => {
  await Deno.mkdir(".data/test-tmp", { recursive: true });
  const path = await Deno.makeTempDir({ dir: ".data/test-tmp" });
  try {
    const { createStore } = await import("./mod.ts");
    let store = await createStore({ dataDir: `${path}/nested/db` });
    const workspace = await store.createWorkspace();
    const created = await store.createCase(workspace, input, analysis);
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const caseId = created.value.case.id;
    assert.equal(
      (await store.disposition(workspace, caseId, 1, "test", "dismissed", "Verified")).ok,
      true,
    );
    const approved = await store.decide(workspace, caseId, 1, "approve", "");
    assert.equal(approved.ok, true);
    const revised = await store.revise(workspace, caseId, 1, input, analysis);
    assert.equal(revised.ok, true);
    if (!revised.ok) return;
    assert.equal(revised.value.case.status, "ready_for_review");
    assert.equal(revised.value.dispositions.length, 0);
    assert.deepEqual(revised.value.events.map((x) => x.type), [
      "submitted",
      "finding_reviewed",
      "approved",
      "revised",
    ]);
    await store.close();
    store = await createStore({ dataDir: `${path}/nested/db` });
    const restored = await store.getCase(workspace, caseId);
    assert.equal(restored.ok, true);
    if (restored.ok) {
      assert.equal(restored.value.case.revision, 2);
      assert.equal(restored.value.revisions.length, 2);
    }
    await store.close();
  } finally {
    await Deno.remove(path, { recursive: true });
  }
});
Deno.test("concurrent decisions cannot create duplicate events", async () => {
  const store = await createTestStore();
  try {
    const workspace = await store.createWorkspace();
    const created = await store.createCase(workspace, input, analysis);
    if (!created.ok) throw new Error("creation failed");
    const caseId = created.value.case.id;
    const outcomes = await Promise.all([
      store.decide(workspace, caseId, 1, "request_changes", "First"),
      store.decide(workspace, caseId, 1, "request_changes", "Second"),
    ]);
    assert.equal(outcomes.filter((x) => x.ok).length, 1);
    assert.equal(outcomes.filter((x) => !x.ok && x.error.code === "conflict").length, 1);
    const detail = await store.getCase(workspace, caseId);
    if (!detail.ok) throw new Error("case missing");
    assert.equal(detail.value.events.filter((e) => e.type === "changes_requested").length, 1);
  } finally {
    await store.close();
  }
});

Deno.test("deletion retains revision, review, and AI evidence while removing active access", async () => {
  const { store, client } = await instrumentedStore();
  try {
    const workspace = await store.createWorkspace();
    assert.equal(await store.hasStoredCases(workspace), false);
    const created = await store.createCase(workspace, input, analysis);
    assert.ok(created.ok);
    const caseId = created.value.case.id;
    assert.ok((await store.disposition(workspace, caseId, 1, "test", "confirmed", "Needs context")).ok);
    assert.ok((await store.addManualFinding(workspace, caseId, 1, "Extra concern", "copy", "Check this")).ok);
    assert.ok((await store.decide(workspace, caseId, 1, "request_changes", "Please revise")).ok);
    assert.ok((await store.revise(workspace, caseId, 1, input, analysis)).ok);
    const generated = {
      content: {
        compliance: { summary: "Review context", concerns: [], questions: [] },
        marketing: { summary: "Clear copy", strengths: [], suggestions: [] },
      },
      model: "test-model",
      promptVersion: "v1",
    };
    assert.ok((await store.saveAiReview(workspace, caseId, 2, generated)).ok);
    const tables = ["revisions", "dispositions", "manual_findings", "decisions", "ai_reviews", "events"];
    const before = await Promise.all(tables.map(async (table) =>
      (await client.query(`SELECT * FROM ${table} WHERE case_id=$1`, [caseId])).rows
    ));
    assert.deepEqual(await store.deleteCase(workspace, caseId, 2), {
      ok: true, value: { deleted: true, id: caseId },
    });
    const [deleted] = (await client.query<Record<string, unknown>>("SELECT deleted_at,status,revision FROM cases WHERE id=$1", [caseId])).rows;
    assert.ok(deleted.deleted_at);
    assert.equal(deleted.status, "ready_for_review");
    assert.equal(deleted.revision, 2);
    for (const [index, table] of tables.entries()) {
      const after = (await client.query<Record<string, unknown>>(`SELECT * FROM ${table} WHERE case_id=$1`, [caseId])).rows;
      assert.deepEqual(after.filter((row) => row.type !== "deleted"), before[index], table);
      if (table === "events") {
        const event = after.find((row) => row.type === "deleted");
        assert.ok(event);
        assert.equal(event.actor, "submitter");
        assert.equal(event.revision, 2);
        assert.equal(after.length, before[index].length + 1);
      }
    }
    assert.equal(await store.hasStoredCases(workspace), true);
    assert.deepEqual(await store.listCases(workspace), []);
    for (const result of [
      await store.getCase(workspace, caseId),
      await store.getAiReview(workspace, caseId, 2),
      await store.saveAiReview(workspace, caseId, 2, generated),
      await store.deleteCase(workspace, caseId, 2),
      await store.revise(workspace, caseId, 2, input, analysis),
      await store.decide(workspace, caseId, 2, "request_changes", "Feedback"),
    ]) {
      assert.ok(!result.ok);
      assert.equal(result.error.code, "not_found");
    }
  } finally { await store.close(); }
});

Deno.test("deletion rolls back if audit insertion fails and concurrent deletion records one event", async () => {
  const { store, client, state } = await instrumentedStore();
  try {
    const workspace = await store.createWorkspace();
    const created = await store.createCase(workspace, input, analysis);
    assert.ok(created.ok);
    const caseId = created.value.case.id;
    state.failAfter = 3; // Lock succeeds, update succeeds, event insert fails.
    const failed = await store.deleteCase(workspace, caseId, 1);
    assert.ok(!failed.ok);
    assert.equal(failed.error.code, "storage");
    assert.ok((await store.getCase(workspace, caseId)).ok);
    const outcomes = await Promise.all([
      store.deleteCase(workspace, caseId, 1), store.deleteCase(workspace, caseId, 1),
    ]);
    assert.equal(outcomes.filter((result) => result.ok).length, 1);
    assert.equal(outcomes.filter((result) => !result.ok && result.error.code === "not_found").length, 1);
    const events = await client.query("SELECT id FROM events WHERE case_id=$1 AND type='deleted'", [caseId]);
    assert.equal(events.rows.length, 1);
  } finally { await store.close(); }
});

Deno.test("deletion serializes with approval and revision under the same case lock", async () => {
  const store = await createTestStore();
  try {
    const workspace = await store.createWorkspace();
    const clean = { ...analysis, checks: [] };
    for (const action of ["approve", "revise"] as const) {
      for (const deleteFirst of [true, false]) {
        const created = await store.createCase(workspace, input, clean);
        assert.ok(created.ok);
        const caseId = created.value.case.id;
        const mutate = () => action === "approve"
          ? store.decide(workspace, caseId, 1, "approve", "Reviewed")
          : store.revise(workspace, caseId, 1, input, clean);
        const remove = () => store.deleteCase(workspace, caseId, 1);
        const outcomes = await Promise.all(deleteFirst ? [remove(), mutate()] : [mutate(), remove()]);
        assert.equal(outcomes.filter((result) => result.ok).length, 1);
        const deletion = outcomes[deleteFirst ? 0 : 1];
        const mutation = outcomes[deleteFirst ? 1 : 0];
        if (deletion.ok) {
          assert.ok(!mutation.ok);
          assert.equal(mutation.error.code, "not_found");
          assert.deepEqual(await store.getCase(workspace, caseId), {
            ok: false, error: { code: "not_found", message: "Case not found" },
          });
        } else {
          assert.ok(mutation.ok);
          assert.equal(deletion.error.code, action === "approve" ? "blocked" : "conflict");
          const current = await store.getCase(workspace, caseId);
          assert.ok(current.ok);
          assert.equal(current.value.case.status, action === "approve" ? "approved" : "ready_for_review");
          assert.equal(current.value.case.revision, action === "approve" ? 1 : 2);
        }
      }
    }
  } finally { await store.close(); }
});

Deno.test("queue lists current summaries in one query, ordered and workspace scoped", async () => {
  const { store, state } = await instrumentedStore();
  try {
    const workspace = await store.createWorkspace(), other = await store.createWorkspace();
    const first = await store.createCase(workspace, { ...input, title: "First" }, analysis);
    const second = await store.createCase(workspace, { ...input, title: "Second" }, analysis);
    const hidden = await store.createCase(other, { ...input, title: "Hidden" }, analysis);
    if (!first.ok || !second.ok || !hidden.ok) throw new Error("setup failed");
    const revised = await store.revise(workspace, first.value.case.id, 1, {
      ...input,
      title: "Revised",
      publisher: "New publisher",
    }, {
      ...analysis,
      checks: [{ ...analysis.checks[0], status: "unknown" }, {
        ...analysis.checks[0],
        ruleId: "other",
      }],
    });
    if (!revised.ok) throw new Error("revision failed");
    state.queries = 0;
    const rows = await store.listCases(workspace);
    assert.equal(state.queries, 1);
    assert.deepEqual(rows.map((r) => r.id), [first.value.case.id, second.value.case.id]);
    assert.equal(rows[0].title, "Revised");
    assert.equal(rows[0].publisher, "New publisher");
    assert.equal(rows[0].revision, 2);
    assert.equal(rows[0].findings, 1);
    assert.equal(rows[0].unknowns, 1);
    assert.equal(rows[1].findings, 1);
    assert.equal(rows[1].unknowns, 0);
    assert.equal("revisions" in rows[0], false);
    assert.equal("content" in rows[0], false);
  } finally {
    await store.close();
  }
});

Deno.test("atomic workspace bootstrap validates approval and leaves no records on storage failure", async () => {
  const { store, state, client } = await instrumentedStore();
  try {
    const invalid = await store.createSeededWorkspace([{
      input,
      analysis,
      decision: { decision: "approve", note: "", dispositions: [] },
    }]);
    assert.equal(invalid.ok, false);
    if (!invalid.ok) assert.equal(invalid.error.code, "blocked");
    const noReason = await store.createSeededWorkspace([{
      input,
      analysis,
      decision: {
        decision: "approve",
        note: "",
        dispositions: [{ ruleId: "test", action: "dismissed", reason: "" }],
      },
    }]);
    assert.equal(noReason.ok, false);
    if (!noReason.ok) assert.equal(noReason.error.code, "invalid");
    state.failAfter = 3;
    const failed = await store.createSeededWorkspace([{ input, analysis }]);
    assert.equal(failed.ok, false);
    if (!failed.ok) assert.equal(failed.error.code, "storage");
    const rows = await client.query<{ workspaces: number; cases: number }>(
      "SELECT (SELECT count(*) FROM workspaces) AS workspaces, (SELECT count(*) FROM cases) AS cases",
    );
    assert.equal(Number(rows.rows[0].workspaces), 0);
    assert.equal(Number(rows.rows[0].cases), 0);
  } finally {
    await store.close();
  }
});

Deno.test("bulk seed applies review guards and records ordered evidence with bounded queries", async () => {
  const { store, state } = await instrumentedStore();
  try {
    const rejected = await store.createSeededWorkspace([{
      input,
      analysis,
      decision: { decision: "request_changes", note: "", dispositions: [] },
    }]);
    assert.equal(rejected.ok, false);
    if (!rejected.ok) assert.equal(rejected.error.code, "invalid");
    state.queries = 0;
    const seeded = await store.createSeededWorkspace([
      {
        input,
        analysis,
        decision: {
          decision: "approve",
          note: "Reviewed",
          dispositions: [{ ruleId: "test", action: "dismissed", reason: "Verified" }],
        },
      },
      {
        input: { ...input, title: "Needs changes" },
        analysis,
        decision: {
          decision: "request_changes",
          note: "",
          dispositions: [{ ruleId: "test", action: "confirmed", reason: "Fix this" }],
        },
      },
      ...Array.from({ length: 4 }, () => ({ input, analysis })),
    ]);
    assert.equal(seeded.ok, true);
    if (!seeded.ok) return;
    assert.ok(state.queries <= 6, `expected at most six queries, got ${state.queries}`);
    const cases = await store.listCases(seeded.value);
    const approved = cases.find((c) => c.status === "approved")!,
      changes = cases.find((c) => c.status === "changes_requested")!;
    assert.ok(approved);
    assert.ok(changes);
    const a = await store.getCase(seeded.value, approved.id),
      b = await store.getCase(seeded.value, changes.id);
    if (!a.ok || !b.ok) throw new Error("seeded detail missing");
    assert.deepEqual(a.value.events.map((e) => e.type), [
      "submitted",
      "finding_reviewed",
      "approved",
    ]);
    assert.equal(a.value.dispositions[0].reason, "Verified");
    assert.deepEqual(b.value.events.map((e) => e.type), [
      "submitted",
      "finding_reviewed",
      "changes_requested",
    ]);
    assert.match(b.value.events.at(-1)!.message, /Fix this/);
  } finally {
    await store.close();
  }
});

Deno.test("bulk seed preserves plan order and chronological disposition history", async () => {
  const store = await createTestStore();
  try {
    const both = {
      ...analysis,
      checks: [{ ...analysis.checks[0], ruleId: "z-first" }, {
        ...analysis.checks[0],
        ruleId: "a-second",
      }],
    };
    const seeded = await store.createSeededWorkspace([
      { input: { ...input, title: "First" }, analysis },
      {
        input: { ...input, title: "Second" },
        analysis: both,
        decision: {
          decision: "approve",
          note: "Done",
          dispositions: [{ ruleId: "z-first", action: "dismissed", reason: "First review" }, {
            ruleId: "a-second",
            action: "dismissed",
            reason: "Second review",
          }],
        },
      },
      { input: { ...input, title: "Third" }, analysis },
    ]);
    if (!seeded.ok) throw new Error("seed failed");
    const rows = await store.listCases(seeded.value);
    assert.deepEqual(rows.map((row) => row.title), ["Third", "Second", "First"]);
    const detail = await store.getCase(seeded.value, rows[1].id);
    if (!detail.ok) throw new Error("detail missing");
    assert.deepEqual(detail.value.dispositions.map((d) => d.ruleId), ["z-first", "a-second"]);
    const events = detail.value.events;
    assert.deepEqual(events.map((e) => e.type), [
      "submitted",
      "finding_reviewed",
      "finding_reviewed",
      "approved",
    ]);
    assert.ok(events.every((event, i) => i === 0 || event.createdAt > events[i - 1].createdAt));
    assert.equal(detail.value.case.createdAt, events[0].createdAt);
    assert.equal(detail.value.case.updatedAt, events.at(-1)!.createdAt);
    assert.ok(Date.parse(rows[0].updatedAt) <= Date.now());
  } finally {
    await store.close();
  }
});

Deno.test("dashboard SQL filters and sorts within one workspace while retaining cohort counts", async () => {
  const { store, state, client } = await instrumentedStore();
  const { dashboardQuerySchema } = await import("@clearpath/contracts");
  const query = (values: Record<string, string> = {}) => dashboardQuerySchema.parse({ today: "2026-11-04", ...values });
  const clean: Analysis = { ...analysis, checks: [] };
  const incomplete: Analysis = { ...analysis, checks: [{ ...analysis.checks[0], ruleId: "review-context", status: "unknown" }] };
  try {
    const workspace = await store.createWorkspace(), other = await store.createWorkspace();
    const specs = [
      { title: "Delta 100%_ offer", publisher: "Partner Studio", launchDate: "2026-11-03", productId: "card" as const, analysis: clean },
      { title: "Alpha offer", publisher: "Partner Studio", launchDate: "2026-11-04", productId: "card" as const, analysis: incomplete },
      { title: "Bravo loan", publisher: "Other publisher", launchDate: "2026-11-02", productId: "personal_loan" as const, analysis: clean },
      { title: "Charlie approved", publisher: "Partner Studio", launchDate: "2026-11-05", productId: "card" as const, analysis: clean },
      { title: "Echo invalid legacy date", publisher: "Partner Studio", launchDate: "2026-02-30", productId: "card" as const, analysis: clean },
    ];
    const ids: string[] = [];
    for (const spec of specs) {
      const saved = await store.createCase(workspace, { ...input, ...spec }, spec.analysis);
      if (!saved.ok) throw new Error("fixture failed");
      ids.push(saved.value.case.id);
    }
    await store.createCase(other, { ...input, title: "Hidden Partner Studio" }, clean);
    assert.equal((await store.decide(workspace, ids[2], 1, "request_changes", "Revise loan")).ok, true);
    assert.equal((await store.decide(workspace, ids[3], 1, "approve", "Reviewed")).ok, true);
    for (let index = 0; index < ids.length; index++) {
      await client.query("UPDATE cases SET created_at=$1, updated_at=$1 WHERE id=$2", ["2026-11-0" + (index + 1) + "T00:00:00Z", ids[index]]);
    }
    state.queries = 0;
    const filtered = await store.dashboard(workspace, query({ product: "card", status: "approved" }));
    assert.equal(state.queries, 1);
    assert.equal(filtered.workspaceTotal, 5);
    assert.deepEqual(filtered.rows.map((item) => item.id), [ids[3]]);
    assert.deepEqual(filtered.cohort.map((item) => item.id), [ids[0], ids[1], ids[3], ids[4]]);
    assert.deepEqual(filtered.overview.counts, { ready_for_review: 2, needs_information: 1, changes_requested: 0, approved: 1 });
    assert.equal(filtered.overview.openCount, 3);
    assert.equal(filtered.overview.nextLaunchDate, "2026-11-03");
    assert.equal(filtered.overview.overdueCount, 1);
    assert.deepEqual(filtered.overview.actionable.map((item) => item.id), [ids[0], ids[1], ids[4]]);
    assert.deepEqual((await store.dashboard(workspace, query({ product: "card", direction: "desc" }))).rows.map((item) => item.id), [ids[3], ids[1], ids[0], ids[4]]);
    assert.deepEqual((await store.dashboard(workspace, query({ product: "card", sort: "title" }))).rows.map((item) => item.id), [ids[1], ids[3], ids[0], ids[4]]);
    assert.deepEqual((await store.dashboard(workspace, query({ product: "card", sort: "updatedAt", direction: "desc" }))).rows.map((item) => item.id), [ids[4], ids[3], ids[1], ids[0]]);
    const submitter = await store.dashboard(workspace, query({ role: "submitter" }));
    assert.deepEqual(submitter.overview.actionable.map((item) => item.id), [ids[2], ids[1]]);
    for (const q of ["100%_", "%", "_", "DELTA", " delta 100%_ "]) {
      assert.deepEqual((await store.dashboard(workspace, query({ q }))).rows.map((item) => item.id), [ids[0]]);
    }
    assert.equal((await store.dashboard(workspace, query({ q: "PARTNER STUDIO" }))).rows.length, 4);
    assert.equal((await store.dashboard(workspace, query({ q: "' OR 1=1 --" }))).rows.length, 0);
    assert.equal((await store.dashboard(other, query())).workspaceTotal, 1);
    assert.equal((await store.dashboard(workspace, query({ status: "changes_requested", product: "card" }))).cohort.length, 4);
    // Equal target dates retain creation/ID tie order in either direction.
    await client.query("UPDATE revisions SET input=jsonb_set(input,'{launchDate}','\"2026-11-03\"') WHERE case_id=$1", [ids[1]]);
    const tiedAsc = (await store.dashboard(workspace, query({ q: "Partner Studio" }))).rows;
    const tiedDesc = (await store.dashboard(workspace, query({ q: "Partner Studio", direction: "desc" }))).rows;
    assert.deepEqual(tiedAsc.filter((item) => item.launchDate === "2026-11-03").map((item) => item.id), [ids[0], ids[1]]);
    assert.deepEqual(tiedDesc.filter((item) => item.launchDate === "2026-11-03").map((item) => item.id), [ids[0], ids[1]]);
    await client.query("UPDATE cases SET created_at='2026-11-01T00:00:00Z' WHERE id=$1", [ids[1]]);
    assert.deepEqual((await store.dashboard(workspace, query())).rows.filter((item) => item.launchDate === "2026-11-03").map((item) => item.id), [ids[0], ids[1]].sort());
  } finally { await store.close(); }
});
