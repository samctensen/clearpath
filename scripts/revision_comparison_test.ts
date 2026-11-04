import { strict as assert } from "node:assert";
import type { Revision, CheckResult } from "../packages/contracts/mod.ts";
import { buildTextDiff, compareRevisionMetadata, compareRevisionChecks } from "../apps/web/src/lib/revision-comparison.ts";

const revision = (content = "0% for 18 months."): Revision => ({
  id: "revision-1", number: 1, contentHash: "snapshot", createdAt: "2026-11-04T00:00:00Z",
  input: { title: "Card offer", publisher: "Example", productId: "card", offerId: "everyday-card", format: "email", launchDate: "2026-11-10", completeAsset: true, linksToApplication: null, substantiation: "", content },
  analysis: { checks: [], policyVersion: "p1", offerVersion: "o1", scope: "Whole copy" },
});
const concern = (text = "18 months"): CheckResult => ({ ruleId: "offer-match", title: "Offer terms", status: "finding", severity: "high", kind: "mismatch", explanation: "Introductory duration differs from the recorded offer.", excerpt: { text, start: 7, end: 7 + text.length }, suggestion: "Align the duration with the offer.", reference: { type: "product_fact", label: "Recorded offer" } });
function roundTrip(previous: string, current: string) {
  const diff = buildTextDiff(previous, current);
  assert.equal(diff.parts.filter(p => p.kind !== "added").map(p => p.text).join(""), previous);
  assert.equal(diff.parts.filter(p => p.kind !== "removed").map(p => p.text).join(""), current);
  return diff;
}
Deno.test("text comparison isolates an 18 to 12 correction", () => {
  assert.deepEqual(buildTextDiff("0% for 18 months.", "0% for 12 months."), { grouped: false, parts: [{ kind: "unchanged", text: "0% for " }, { kind: "removed", text: "18" }, { kind: "added", text: "12" }, { kind: "unchanged", text: " months." }] });
});
Deno.test("diff preserves whitespace, punctuation, Unicode and repeated words exactly", () => {
  for (const [before, after] of [["Fee: €5.\nApply now", "Fee: €6!  Apply now"], ["a b a b", "b a b a"], ["", "New copy"], ["Removed", ""], ["😀 café	terms", "😀 café terms\n"], ["same", "same"]]) roundTrip(before, after);
});
Deno.test("large unrelated revisions use a bounded grouped comparison without dropping text", () => {
  const result = roundTrip("old ".repeat(3000), "new ".repeat(3000));
  assert.equal(result.grouped, true);
  assert.equal(result.parts.some(p => p.kind === "removed"), true);
  assert.equal(result.parts.some(p => p.kind === "added"), true);
});
Deno.test("a small edit in long copy remains precise after common context is removed", () => {
  const result = roundTrip("unchanged ".repeat(1500) + "18 months.", "unchanged ".repeat(1500) + "12 months.");
  assert.equal(result.grouped, false);
  assert.deepEqual(result.parts.filter(p => p.kind !== "unchanged"), [{ kind: "removed", text: "18" }, { kind: "added", text: "12" }]);
});
Deno.test("format-only and completeness changes are visible with identical copy", () => {
  const before = revision(); const after = revision();
  after.input.format = "banner"; after.input.completeAsset = false;
  assert.deepEqual(compareRevisionMetadata(before, after), [{ label: "Format", previous: "Email", current: "Banner ad" }, { label: "Copy provided", previous: "Complete asset", current: "Excerpt only" }]);
});
Deno.test("all saved review context changes are included without treating copy as metadata", () => {
  const before = revision(); const after = revision("new copy");
  Object.assign(after.input, { title: "New title", publisher: "New publisher", productId: "personal_loan", offerId: null, launchDate: "2026-12-01", linksToApplication: true, substantiation: "Evidence" });
  Object.assign(after.analysis, { policyVersion: "p2", offerVersion: "o2", scope: "Updated scope" });
  assert.deepEqual(compareRevisionMetadata(before, after).map(p => p.label), ["Title", "Publisher", "Product", "Offer", "Target launch", "Links to an application", "Supporting evidence", "Policy version", "Offer version", "Check scope"]);
});
Deno.test("the same rule exposes changed evidence rather than counting as unchanged", () => {
  const before = revision(); const after = revision();
  before.analysis.checks = [concern()]; after.analysis.checks = [concern("24 months")];
  const result = compareRevisionChecks(before, after);
  assert.equal(result.length, 1); assert.equal(result[0].kind, "updated");
  assert.equal(result[0].previous?.excerpt?.text, "18 months"); assert.equal(result[0].current?.excerpt?.text, "24 months");
});
Deno.test("moving identical evidence in the copy does not count as a changed concern", () => {
  const before = revision(); const after = revision();
  before.analysis.checks = [concern()]; after.analysis.checks = [{ ...concern(), excerpt: { text: "18 months", start: 100, end: 109 } }];
  assert.equal(compareRevisionChecks(before, after)[0].kind, "unchanged");
});
Deno.test("changed check outcome and explanation remain visible under the same rule", () => {
  const before = revision(); const after = revision();
  before.analysis.checks = [concern()]; after.analysis.checks = [{ ...concern(), status: "unknown", explanation: "Need the current offer" }];
  assert.equal(compareRevisionChecks(before, after)[0].kind, "updated");
});
Deno.test("new, no-longer-flagged and absent checks have distinct meanings", () => {
  const before = revision(); const after = revision();
  before.analysis.checks = [concern(), { ...concern(), ruleId: "missing-check" }];
  after.analysis.checks = [{ ...concern(), status: "passed" }, { ...concern(), ruleId: "new-check" }];
  assert.deepEqual(compareRevisionChecks(before, after).map(p => [p.current?.ruleId ?? p.previous?.ruleId, p.kind]), [["offer-match", "cleared"], ["missing-check", "not_checked"], ["new-check", "new"]]);
});
