import { strict as assert } from "node:assert";
import { analyze, offers } from "@clearpath/checks";
import { createTestStore } from "@clearpath/models";
import { buildSeedPlans, DEFAULT_SEED_CASES } from "../src/seed.ts";

Deno.test("approved seed campaigns agree with their offer and need no dismissals", () => {
  const plans = buildSeedPlans(offers, analyze, 250);
  assert.equal(buildSeedPlans(offers, analyze).length, DEFAULT_SEED_CASES);
  const approved = plans.filter((plan) => plan.decision?.decision === "approve");
  assert.ok(approved.length > 20);
  for (const plan of approved) {
    assert.deepEqual(
      plan.analysis.checks.filter((check) => check.status === "finding" || check.status === "unknown"),
      [],
      `${plan.input.title} must be defensible without dismissing a real concern`,
    );
    assert.deepEqual(plan.decision!.dispositions, []);
    assert.equal(plan.input.completeAsset, true);
    assert.equal(plan.analysis.offerVersion, offers.find((offer) => offer.id === plan.input.offerId)!.version);
  }
});

Deno.test("seed approvals fail closed when a catalog or check change introduces a concern", () => {
  const plans = buildSeedPlans(offers, (input) => {
    const result = analyze(input);
    return { ...result, checks: [...result.checks, {
      ruleId: "new-context", title: "New required context", status: "unknown" as const,
      severity: "info" as const, kind: "missing_information" as const,
      explanation: "Provide the newly required context.",
      reference: { label: "Fixture policy", type: "company_policy" as const },
    }] };
  });
  assert.ok(plans.every((plan) => plan.decision?.decision !== "approve"));
  assert.ok(plans.every((plan) => !plan.decision?.dispositions.some((item) => item.action === "dismissed")));
});

Deno.test("a seeded mismatch supports request, corrected revision, and exact-revision approval", async () => {
  const store = await createTestStore();
  try {
    const plan = buildSeedPlans(offers, analyze).find((item) => item.input.title.endsWith("welcome series email"))!;
    const seeded = await store.createSeededWorkspace([plan]);
    assert.ok(seeded.ok);
    const [row] = await store.listCases(seeded.value);
    assert.equal(row.status, "changes_requested");
    const before = await store.getCase(seeded.value, row.id);
    assert.ok(before.ok);
    assert.match(before.value.revisions[0].input.content, /18 months/);
    const input = { ...plan.input, content: plan.input.content.replace("18 months", "12 months") };
    const revised = await store.revise(seeded.value, row.id, 1, input, analyze(input));
    assert.ok(revised.ok);
    assert.equal((await store.decide(seeded.value, row.id, 1, "approve", "Stale copy")).ok, false);
    const approved = await store.decide(seeded.value, row.id, 2, "approve", "Introductory period now matches the recorded 12-month offer.");
    assert.ok(approved.ok);
    assert.deepEqual(approved.value.events.map((event) => event.type), ["submitted", "finding_reviewed", "changes_requested", "revised", "approved"]);
    assert.deepEqual(approved.value.events.slice(0, 3), before.value.events);
    assert.equal(approved.value.case.revision, 2);
    assert.equal(approved.value.case.status, "approved");
    assert.equal(approved.value.dispositions.length, 0);
  } finally { await store.close(); }
});
