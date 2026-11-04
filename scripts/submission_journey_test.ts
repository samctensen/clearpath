import type { Activity, CaseDetail, ManualFinding } from "../packages/contracts/mod.ts";
import { buildSubmissionJourney } from "../apps/web/src/lib/submission-journey.ts";

function equal(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
const event = (id: string, type: Activity["type"], revision: number, createdAt = "2026-01-01T00:00:00Z"): Activity => ({ id, type, revision, createdAt, actor: "reviewer", message: id });
const concern: ManualFinding = { id: "m", title: "Concern", quote: "copy", reason: "reason", status: "open", resolution: null, createdAt: "2026-01-01T00:00:00Z" };
function detail(events: Activity[], revision = 1, manualFindings: ManualFinding[] = []): CaseDetail {
  return { case: { id: "case", title: "Case", publisher: "Publisher", productId: "card", format: "email", launchDate: "2026-02-01", status: "ready_for_review", revision, findings: 0, unknowns: 0, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" }, revisions: [], dispositions: [], manualFindings, events };
}
Deno.test("one submission remains one observed event", () => {
  equal(buildSubmissionJourney(detail([event("s", "submitted", 1), event("f", "finding_reviewed", 1)])).events.map(e => e.id), ["s"]);
});
Deno.test("resubmission preserves decision revision and order", () => {
  const result = buildSubmissionJourney(detail([event("s", "submitted", 1, "2026-01-01T00:00:00Z"), event("r", "changes_requested", 1, "2026-01-02T00:00:00Z"), event("v2", "revised", 2, "2026-01-03T00:00:00Z")], 2));
  equal(result.events.map(e => [e.type, e.revision]), [["submitted", 1], ["changes_requested", 1], ["revised", 2]]);
});
Deno.test("prior approval remains bound to its revision", () => {
  const result = buildSubmissionJourney(detail([event("s", "submitted", 1), event("a", "approved", 1), event("v2", "revised", 2)], 2));
  equal(result.events.filter(e => e.type === "approved").map(e => e.revision), [1]);
  equal(result.currentRevision, 2);
});
Deno.test("open manual concerns survive later revisions", () => {
  const resolved = { ...concern, id: "resolved", status: "resolved" as const };
  equal(buildSubmissionJourney(detail([event("v2", "revised", 2)], 2, [concern, resolved])).openManualConcerns.map(c => c.id), ["m"]);
});
Deno.test("equal timestamps retain source order", () => {
  equal(buildSubmissionJourney(detail([event("a", "submitted", 1), event("b", "changes_requested", 1), event("c", "revised", 2)], 2)).events.map(e => e.id), ["a", "b", "c"]);
});
