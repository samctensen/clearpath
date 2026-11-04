import { strict as assert } from "node:assert";
import { createTestStore, Store } from "./mod.ts";
import { PGlite } from "@electric-sql/pglite";
import type { Analysis, SubmissionInput } from "@clearpath/contracts";

async function instrumentedStore() {
  const client = await PGlite.create("memory://");
  await client.exec(
    await Deno.readTextFile(new URL("./migrations/001_initial.sql", import.meta.url)),
  );
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
