import { strict as assert } from "node:assert";
import type { Activity } from "../packages/contracts/mod.ts";
import { policyRules } from "../packages/checks/policies.ts";
import { decisionReviewEvents, hasDecisionFeedback, matchesPolicy, parseRevisionParam } from "../apps/web/src/lib/reference-pages.ts";

Deno.test("decision reasoning is bounded by the selected revision and decision event", () => {
  const event = (id: string, revision: number, type: Activity["type"], message = id): Activity => ({ id, revision, type, message, actor: "reviewer", createdAt: "2026-11-04T12:00:00Z" });
  const events = [event("old reason", 1, "finding_reviewed"), event("first decision", 1, "changes_requested"), event("revised", 2, "revised"), event("new reason", 2, "finding_reviewed"), event("resolution", 2, "finding_resolved"), event("second decision", 2, "approved"), event("later action", 2, "manual_finding")];
  assert.deepEqual(decisionReviewEvents(events, { revision: 1, decision: "request_changes" }).map((e) => e.message), ["old reason"]);
  assert.deepEqual(decisionReviewEvents(events, { revision: 2, decision: "approve" }).map((e) => e.message), ["new reason", "resolution"]);
  assert.deepEqual(decisionReviewEvents(events, { revision: 3, decision: "approve" }), []);
  assert.deepEqual(decisionReviewEvents(events, { revision: 1, decision: "approve" }), []);
});

Deno.test("outcome-only feedback is hidden while reviewer reasoning is retained", () => {
  for (const text of ["", "Copy approved", " Copy approved. ", "Changes requested"]) assert.equal(hasDecisionFeedback(text), false);
  for (const text of ["Copy approved after checking the offer.", "Approved for this demo.", "Use the 12-month offer."]) assert.equal(hasDecisionFeedback(text), true);
});

Deno.test("policy search finds copy examples and preparation requirements within the product filter", () => {
  const promo = policyRules.find((rule) => rule.id === "card-promo-terms")!;
  const loan = policyRules.find((rule) => rule.id === "loan-repayment")!;
  assert.equal(matchesPolicy(promo, " APPLY TODAY ", "card"), true);
  assert.equal(matchesPolicy(promo, "12 months", "all"), true);
  assert.equal(matchesPolicy(promo, "12 months", "personal_loan"), false);
  assert.equal(matchesPolicy(loan, "underlying offer", "personal_loan"), true);
  assert.equal(matchesPolicy(promo, "not present", "all"), false);
});

Deno.test("revision links accept only positive safe integers", () => {
  assert.equal(parseRevisionParam("1"), 1);
  assert.equal(parseRevisionParam("23"), 23);
  for (const value of [undefined, ["1", "2"], "", "0", "-1", "1.5", "1foo", "1e2", "9007199254740992"]) assert.equal(parseRevisionParam(value), null);
});
