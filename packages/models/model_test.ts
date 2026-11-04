import { strict as assert } from "node:assert";
import { createTestStore } from "./mod.ts";
import type { Analysis, SubmissionInput } from "@clearpath/contracts";

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
