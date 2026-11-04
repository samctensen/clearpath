import { strict as assert } from "node:assert";
import { createTestStore } from "@clearpath/models";
import { analyze, offers, POLICY_VERSION, ruleIds } from "@clearpath/checks";
import type { DecisionRecord, PolicyGuideData, SubmissionInput } from "@clearpath/contracts";
import { createApiServer } from "../src/server.ts";

Deno.test("decision log preserves revision context and feedback and includes historical decisions", async () => {
  const store = await createTestStore();
  const app = await createApiServer({ store, analyze, offers, policyVersion: POLICY_VERSION, seedCaseCount: 18, seed: false });
  try {
    const empty = await app.inject({ method: "GET", url: "/api/decisions" });
    assert.deepEqual(empty.json(), []);
    const request = (url: string, payload?: object, role = "reviewer") => app.inject({ method: payload ? "POST" : "GET", url: `/api${url}`, headers: { "x-demo-role": role }, ...(payload ? { payload } : {}) });
    const input: SubmissionInput = { title: "Original card title", productId: "card", offerId: offers[0].id, content: offers[0].approvedCopy, format: "landing_page", publisher: "Original publisher", launchDate: "2026-11-15", completeAsset: true, linksToApplication: false, substantiation: "" };
    const created = await request("/cases", input);
    assert.equal(created.statusCode, 201);
    const path = `/cases/${created.json().case.id}`;
    assert.equal((await request(`${path}/decision`, { expectedRevision: 1, decision: "approve", note: "Reviewed the complete copy." })).statusCode, 200);
    assert.equal((await request(`${path}/revisions`, { expectedRevision: 1, input: { ...input, title: "Renamed card", publisher: "New publisher", content: input.content.replace("12 months", "18 months") } }, "submitter")).statusCode, 200);
    assert.equal((await request(`${path}/dispositions`, { expectedRevision: 2, ruleId: "offer-match", action: "confirmed", reason: "Use the 12-month offer." })).statusCode, 200);
    assert.equal((await request(`${path}/decision`, { expectedRevision: 2, decision: "request_changes", note: "Correct the promotion." })).statusCode, 200);
    const response = await request("/decisions");
    assert.equal(response.headers["cache-control"], "private, no-store");
    const records = response.json<DecisionRecord[]>();
    assert.equal(records.length, 2);
    assert.equal(records[0].decision, "request_changes");
    assert.equal(records[0].title, "Renamed card");
    assert.match(records[0].feedback, /Correct the promotion.*Use the 12-month offer/);
    const approval = records[1];
    assert.equal(approval.revision, 1);
    assert.equal(approval.currentRevision, 2);
    assert.equal(approval.title, input.title);
    assert.equal(approval.publisher, input.publisher);
    assert.equal(approval.policyVersion, POLICY_VERSION);
    assert.equal(approval.offerVersion, offers[0].version);
    assert.equal(approval.actor, "reviewer");
    assert.equal(approval.caseDeleted, false);
    assert.deepEqual((await request("/decisions")).json(), records);
    // Shared log: a visitor arriving without any prior request reads the same.
    assert.deepEqual((await app.inject({ method: "GET", url: "/api/decisions" })).json(), records);
  } finally { await app.close(); await store.close(); }
});

Deno.test("deleted submissions retain an archived decision record without restoring case access", async () => {
  const store = await createTestStore();
  const app = await createApiServer({ store, analyze, offers, policyVersion: POLICY_VERSION, seedCaseCount: 18, seed: false });
  try {
    const initial = await app.inject({ method: "GET", url: "/api/decisions" });
    const request = (url: string, payload?: object, role = "reviewer") => app.inject({ method: payload ? "POST" : "GET", url: `/api${url}`, headers: { "x-demo-role": role }, ...(payload ? { payload } : {}) });
    const input: SubmissionInput = { title: "Archived campaign", productId: "card", offerId: offers[0].id, content: offers[0].approvedCopy, format: "landing_page", publisher: "Demo publisher", launchDate: "2026-11-15", completeAsset: true, linksToApplication: false, substantiation: "" };
    const created = await request("/cases", input, "submitter");
    assert.equal(created.statusCode, 201);
    const path = `/cases/${created.json().case.id}`;
    assert.equal((await request(`${path}/decision`, { expectedRevision: 1, decision: "request_changes", note: "Please clarify the campaign context." })).statusCode, 200);
    const before = (await request("/decisions")).json<DecisionRecord[]>();
    assert.equal(before.length, 1);
    assert.equal(before[0].caseDeleted, false);
    assert.equal((await request(`${path}/delete`, { expectedRevision: 1 }, "submitter")).statusCode, 200);
    const response = await request("/decisions");
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), before.map(record => ({ ...record, caseDeleted: true })));
    assert.equal((await request(path)).statusCode, 404);
    assert.deepEqual((await request("/cases")).json(), []);
    // The log is shared, so a visitor arriving cold reads the same archived
    // record; the deleted case itself stays unreachable for everyone.
    const cold = await app.inject({ method: "GET", url: "/api/decisions" });
    assert.deepEqual(cold.json(), response.json());
    assert.equal((await app.inject({ method: "GET", url: `/api${path}` })).statusCode, 404);
  } finally { await app.close(); await store.close(); }
});

Deno.test("policy guide covers each executable check with matching titles and sources", async () => {
  const store = await createTestStore();
  const app = await createApiServer({ store, analyze, offers, policyVersion: POLICY_VERSION, seedCaseCount: 18 });
  try {
    const response = await app.inject({ method: "GET", url: "/api/policies" });
    assert.equal(response.statusCode, 200);
    const guide = response.json<PolicyGuideData>();
    assert.equal(guide.policyVersion, POLICY_VERSION);
    assert.deepEqual(guide.rules.map((rule) => rule.id), [...ruleIds]);
    const analysis = analyze({ title: "Policy test", productId: "card", offerId: offers[0].id, content: offers[0].approvedCopy, format: "landing_page", publisher: "Test publisher", launchDate: "2026-11-15", completeAsset: true, linksToApplication: false, substantiation: "" });
    for (const rule of guide.rules) {
      const check = analysis.checks.find((check) => check.ruleId === rule.id)!;
      assert.equal(rule.title, check.title);
      assert.deepEqual(rule.reference, check.reference);
      assert.ok(rule.prepare.length && rule.limits && rule.example.explanation);
    }
    const seeded = await app.inject({ method: "GET", url: "/api/decisions" });
    assert.equal(seeded.json().length, 6);
  } finally { await app.close(); await store.close(); }
});
