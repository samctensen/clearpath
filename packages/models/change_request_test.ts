import { strict as assert } from "node:assert";
import { analyze, offers } from "@clearpath/checks";
import { dashboardQuerySchema, type SubmissionInput } from "@clearpath/contracts";
import { createTestStore } from "./mod.ts";

const offer = offers.find((offer) => offer.id === "flex-personal")!;
const input: SubmissionInput = {
  title: "Repayment correction fixture", productId: offer.productId, offerId: offer.id,
  content: `${offer.approvedCopy} Repay your loan in 36 monthly payments.`, format: "email",
  publisher: "Fixture studio", launchDate: "2026-11-15", completeAsset: true,
  linksToApplication: null, substantiation: "",
};

Deno.test("change requests snapshot each correction with readable evidence and retain it after revision", async () => {
  const store = await createTestStore();
  try {
    const workspace = await store.createWorkspace();
    const created = await store.createCase(workspace, input, analyze(input));
    assert.ok(created.ok);
    const id = created.value.case.id;
    const note = "Send complete repayment disclosures.";
    assert.ok((await store.disposition(workspace, id, 1, "loan-repayment", "confirmed", note)).ok);
    const manual = await store.addManualFinding(workspace, id, 1, "Identify the lender", "ClearPath Flex Personal Loan", "Add the lender's full name.");
    assert.ok(manual.ok);
    const result = await store.decide(workspace, id, 1, "request_changes", note);
    assert.ok(result.ok);
    const event = result.value.events.at(-1)!;
    assert.ok("changeRequest" in event, "The request must carry a saved correction snapshot");
    const feedback = event.changeRequest as { note: string; items: { source: string; sourceId: string; title: string; quote?: string; nextStep: string; reviewerNote?: string }[] };
    assert.equal(feedback.note, note);
    assert.equal(feedback.items.length, 2);
    assert.equal(feedback.items[0].title, analyze(input).checks.find((check) => check.ruleId === "loan-repayment")!.title);
    assert.match(feedback.items[0].quote!, /36 monthly payments/);
    assert.ok(feedback.items[0].nextStep);
    assert.equal(feedback.items[0].reviewerNote, undefined);
    assert.equal(feedback.items[1].title, "Identify the lender");
    assert.equal(feedback.items[1].nextStep, "Add the lender's full name.");
    assert.ok(!event.message.includes("loan-repayment"));
    assert.equal(event.message.split(note).length - 1, 1);
    const dashboard = await store.dashboard(workspace, dashboardQuerySchema.parse({ role: "submitter" }));
    assert.ok(!dashboard.rows[0].guidance!.text.includes("loan-repayment"));
    assert.match(dashboard.rows[0].guidance!.text, /Repayment|repayment/);
    const savedEvents = structuredClone(result.value.events);
    const revised = await store.revise(workspace, id, 1, { ...input, content: offer.approvedCopy }, analyze({ ...input, content: offer.approvedCopy }));
    assert.ok(revised.ok);
    const resolved = await store.resolveManualFinding(workspace, id, 2, manual.value.manualFindings[0].id, "Lender verified in the revised copy.");
    assert.ok(resolved.ok);
    assert.deepEqual(resolved.value.events.slice(0, savedEvents.length), savedEvents);
    assert.equal(resolved.value.events.find((item) => item.type === "changes_requested")!.revision, 1);
    assert.equal(resolved.value.dispositions.length, 0);
    const after = await store.dashboard(workspace, dashboardQuerySchema.parse({ role: "submitter" }));
    assert.equal(after.rows[0].guidance!.kind, "awaiting_review");
    assert.equal(after.rows[0].guidance!.revision, 2);
  } finally { await store.close(); }
});

Deno.test("seeded change requests use the same evidence snapshot as ordinary decisions", async () => {
  const store = await createTestStore();
  try {
    const seeded = await store.createSeededWorkspace([{ input, analysis: analyze(input), decision: {
      decision: "request_changes", note: "Complete the repayment example.",
      dispositions: [{ ruleId: "loan-repayment", action: "confirmed", reason: "Complete the repayment example." }],
    } }]);
    assert.ok(seeded.ok);
    const [row] = await store.listCases(seeded.value);
    const result = await store.getCase(seeded.value, row.id);
    assert.ok(result.ok);
    const event = result.value.events.at(-1)!;
    assert.ok("changeRequest" in event, "Bulk seeding must retain specific requested corrections");
    assert.ok(!event.message.includes("loan-repayment"));
  } finally { await store.close(); }
});

Deno.test("the additive feedback migration preserves legacy audit bytes and is safe to reapply", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const { Store } = await import("./mod.ts");
  const client = await PGlite.create("memory://");
  try {
    for (const file of ["001_initial.sql", "002_ai_reviews.sql", "003_soft_delete_cases.sql", "004_queue_paging.sql"]) {
      await client.exec(await Deno.readTextFile(new URL(`./migrations/${file}`, import.meta.url)));
    }
    const message = "Send complete repayment disclosures.; loan-repayment: Send complete repayment disclosures.";
    await client.query("INSERT INTO workspaces(id) VALUES ('legacy')");
    await client.query("INSERT INTO cases(id,workspace_id,status,revision) VALUES ('case','legacy','changes_requested',1)");
    await client.query("INSERT INTO revisions(id,case_id,number,input,analysis,content_hash) VALUES ('revision','case',1,$1::jsonb,$2::jsonb,'hash')", [JSON.stringify(input), JSON.stringify(analyze(input))]);
    await client.query("INSERT INTO events(id,case_id,type,actor,message,revision) VALUES ('event','case','changes_requested','reviewer',$1,1)", [message]);
    const migration = await Deno.readTextFile(new URL("./migrations/005_change_request_feedback.sql", import.meta.url));
    await client.exec(migration);
    await client.exec(migration);
    type DB = ConstructorParameters<typeof Store>[0];
    const wrap = (db: any): DB => ({ query: async (sql, params = []) => (await db.query(sql, params)).rows,
      transaction: async (fn) => db.transaction((tx: any) => fn(wrap(tx))), close: async () => {} });
    const store = new Store(wrap(client), "pglite");
    const result = await store.getCase("legacy", "case");
    assert.ok(result.ok);
    assert.equal(result.value.events[0].message, message);
    assert.equal(result.value.events[0].changeRequest, undefined);
    const dashboard = await store.dashboard("legacy", dashboardQuerySchema.parse({ role: "submitter" }));
    assert.equal(dashboard.rows[0].guidance!.text, message);
  } finally { await client.close(); }
});
