import { strict as assert } from "node:assert";
import { buildChangeRequestFeedback, formatChangeRequestFeedback } from "./change-request.ts";
import type { CheckResult, ManualFinding } from "./mod.ts";

const check: CheckResult = {
  ruleId: "offer-match", title: "Offer terms match", status: "finding", severity: "high", kind: "mismatch",
  excerpt: { text: "18 months", start: 5, end: 14 }, explanation: "The recorded offer allows 12 months.",
  suggestion: "Change 18 months to 12 months.", reference: { label: "Offer", type: "product_fact" },
};
const manual: ManualFinding = { id: "manual-1", title: "Add lender", quote: "Our loan", reason: "Name the lender.",
  status: "open", resolution: null, createdAt: "2026-11-04T00:00:00Z" };

Deno.test("feedback preview includes only confirmed current concerns and open manual findings", () => {
  const feedback = buildChangeRequestFeedback({ note: "Please update this copy.",
    checks: [check, { ...check, ruleId: "dismissed" }, { ...check, ruleId: "unconfirmed" }, { ...check, ruleId: "passed", status: "passed" }],
    dispositions: [{ ruleId: "offer-match", action: "confirmed", reason: "Change 18 months to 12 months." },
      { ruleId: "dismissed", action: "dismissed", reason: "Not applicable" },
      { ruleId: "passed", action: "confirmed", reason: "Stale confirmation" }],
    manualFindings: [manual, { ...manual, id: "resolved", status: "resolved" }],
  });
  assert.deepEqual(feedback.items.map((item) => item.sourceId), ["offer-match", "manual-1"]);
  assert.equal(feedback.items[0].quote, "18 months");
  assert.equal(feedback.items[0].reviewerNote, undefined);
  const text = formatChangeRequestFeedback(feedback);
  assert.ok(!text.includes("offer-match"));
  assert.equal(text.split(check.suggestion!).length - 1, 1);
  assert.match(text, /Offer terms match/);
});

Deno.test("a distinct reviewer rationale is preserved and duplicate note/correction is shown once", () => {
  const feedback = buildChangeRequestFeedback({ note: "Name the lender.", checks: [check],
    dispositions: [{ ruleId: check.ruleId, action: "confirmed", reason: "The longer promotion is not authorized." }],
    manualFindings: [manual] });
  assert.equal(feedback.note, "");
  assert.equal(feedback.items[0].reviewerNote, "The longer promotion is not authorized.");
  assert.equal(formatChangeRequestFeedback(feedback).split("Name the lender.").length - 1, 1);
});

Deno.test("missing context and note-only requests remain actionable without invented quotes", () => {
  const unknown = { ...check, status: "unknown" as const, excerpt: undefined, suggestion: undefined,
    explanation: "Provide the complete asset." };
  const feedback = buildChangeRequestFeedback({ note: "", checks: [unknown],
    dispositions: [{ ruleId: check.ruleId, action: "confirmed", reason: "" }], manualFindings: [] });
  assert.equal(feedback.items[0].quote, undefined);
  assert.equal(feedback.items[0].nextStep, "Provide the complete asset.");
  assert.equal(feedback.items[0].explanation, undefined);
  const noteOnly = buildChangeRequestFeedback({ note: "  Identify the publisher.  ", checks: [check], dispositions: [], manualFindings: [] });
  assert.deepEqual(noteOnly, { note: "Identify the publisher.", items: [] });
});
