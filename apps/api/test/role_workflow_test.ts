import { strict as assert } from "node:assert";
import { createTestStore } from "@clearpath/models";
import type { Analysis, CaseDetail } from "@clearpath/contracts";
import { createApiServer } from "../src/server.ts";

const input = { title: "Sample submission", productId: "card", offerId: "everyday-card", content: "A sample credit card offer.", format: "email", publisher: "Example", launchDate: "2026-11-03", completeAsset: true, linksToApplication: null, substantiation: "" };
const clear: Analysis = { checks: [], policyVersion: "test", offerVersion: null, scope: "Text only" };
const missing: Analysis = { ...clear, checks: [{ ruleId: "review-context", title: "Context", status: "unknown", severity: "info", kind: "missing_information", explanation: "More context needed", reference: { label: "Policy", type: "company_policy" } }] };

Deno.test("manual concerns survive revisions and only reviewers can resolve them before exact-revision approval", async () => {
  const store = await createTestStore();
  const app = await createApiServer({ store, analyze: (submission) => submission.content.includes("missing context") ? missing : clear, offers: [], policyVersion: "test", seed: false });
  try {
    const post = (url: string, payload: object, role = "reviewer") => app.inject({ method: "POST", url, headers: { "content-type": "application/json", "x-demo-role": role }, payload });
    const created = await post("/api/cases", input, "submitter");
    assert.equal(created.statusCode, 201);
    const path = `/api/cases/${created.json<CaseDetail>().case.id}`;
    const added = await post(`${path}/manual-findings`, { expectedRevision: 1, title: "Clarify terms", quote: "credit card", reason: "Terms are unclear" });
    assert.equal(added.statusCode, 200);
    const concern = added.json<CaseDetail>().manualFindings[0];
    const request = await post(`${path}/decision`, { expectedRevision: 1, decision: "request_changes", note: "Please clarify the terms." });
    assert.equal(request.statusCode, 200);
    assert.equal(request.json<CaseDetail>().events.findLast((event) => event.type === "changes_requested")?.revision, 1);
    const revised = await post(`${path}/revisions`, { expectedRevision: 1, input: { ...input, content: "A revised credit card offer." } }, "submitter");
    assert.equal(revised.statusCode, 200);
    assert.equal(revised.json<CaseDetail>().case.status, "ready_for_review");
    assert.equal(revised.json<CaseDetail>().manualFindings[0].status, "open");
    assert.equal((await post(`${path}/decision`, { expectedRevision: 2, decision: "approve", note: "" })).statusCode, 422);
    assert.equal((await post(`${path}/manual-findings/${concern.id}/resolve`, { expectedRevision: 2, resolution: "Addressed" }, "submitter")).statusCode, 403);
    assert.equal((await post(`${path}/decision`, { expectedRevision: 2, decision: "approve", note: "" }, "submitter")).statusCode, 403);
    assert.equal((await post(`${path}/manual-findings/${concern.id}/resolve`, { expectedRevision: 1, resolution: "Addressed" })).statusCode, 409);
    assert.equal((await post(`${path}/manual-findings/${concern.id}/resolve`, { expectedRevision: 2, resolution: "Addressed" })).statusCode, 200);
    const approved = await post(`${path}/decision`, { expectedRevision: 2, decision: "approve", note: "Reviewed the revised copy." });
    assert.equal(approved.statusCode, 200);
    assert.equal(approved.json<CaseDetail>().events.findLast((event) => event.type === "approved")?.revision, 2);
    const next = await post(`${path}/revisions`, { expectedRevision: 2, input: { ...input, content: "A revision with missing context." } }, "submitter");
    assert.equal(next.statusCode, 200);
    assert.equal(next.json<CaseDetail>().case.status, "needs_information");
    assert.equal(next.json<CaseDetail>().case.revision, 3);
  } finally {
    await app.close();
    await store.close();
  }
});
