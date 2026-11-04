import { strict as assert } from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { createTestStore, Store } from "./mod.ts";
import type { AiReviewContent, Analysis, SubmissionInput } from "@clearpath/contracts";

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
  checks: [],
  policyVersion: "1",
  offerVersion: null,
  scope: "Text only",
};
const content: AiReviewContent = {
  compliance: { summary: "Review the supplied context.", concerns: [], questions: [] },
  marketing: { summary: "Clear copy.", strengths: ["Concise"], suggestions: [] },
};
const generated = { content, model: "test-model", promptVersion: "v1" };

Deno.test("AI reviews preserve approved case state and keep the first concurrent result", async () => {
  const store = await createTestStore();
  try {
    assert.equal(typeof store.getAiReview, "function");
    const workspace = await store.createWorkspace();
    const created = await store.createCase(workspace, input, analysis);
    assert.ok(created.ok);
    const id = created.value.case.id;
    const approved = await store.decide(workspace, id, 1, "approve", "Reviewed");
    assert.ok(approved.ok);
    assert.deepEqual(await store.getAiReview(workspace, id, 1), { ok: true, value: null });
    const results = await Promise.all([
      store.saveAiReview(workspace, id, 1, generated),
      store.saveAiReview(workspace, id, 1, { ...generated, model: "other-model" }),
    ]);
    assert.ok(results[0].ok && results[1].ok);
    assert.deepEqual(results[0].value, results[1].value);
    assert.equal(results[0].value.contentHash, created.value.revisions[0].contentHash);
    assert.equal(results[0].value.revision, 1);
    assert.ok(Number.isFinite(Date.parse(results[0].value.createdAt)));
    assert.deepEqual(await store.getAiReview(workspace, id, 1), results[0]);
    assert.deepEqual(await store.getCase(workspace, id), approved);
  } finally {
    await store.close();
  }
});

Deno.test("AI review storage isolates workspaces and refuses stale writes even when cached", async () => {
  const store = await createTestStore();
  try {
    assert.equal(typeof store.saveAiReview, "function");
    const workspace = await store.createWorkspace(), other = await store.createWorkspace();
    const created = await store.createCase(workspace, input, analysis);
    assert.ok(created.ok);
    const id = created.value.case.id;
    for (
      const result of [
        await store.getAiReview(other, id, 1),
        await store.saveAiReview(other, id, 1, generated),
        await store.getAiReview(workspace, id, 99),
      ]
    ) {
      assert.ok(!result.ok);
      assert.equal(result.error.code, "not_found");
    }
    assert.ok((await store.saveAiReview(workspace, id, 1, generated)).ok);
    assert.ok((await store.revise(workspace, id, 1, input, analysis)).ok);
    const stale = await store.saveAiReview(workspace, id, 1, generated);
    assert.ok(!stale.ok);
    assert.equal(stale.error.code, "conflict");
    assert.ok((await store.getAiReview(workspace, id, 1)).ok);
    assert.deepEqual(await store.getAiReview(workspace, id, 2), { ok: true, value: null });
  } finally {
    await store.close();
  }
});

Deno.test("AI budget atomically bounds concurrent requests and rolls back a workspace cap", async () => {
  const store = await createTestStore();
  try {
    assert.equal(typeof store.consumeAiReviewBudget, "function");
    const first = await store.createWorkspace(), second = await store.createWorkspace();
    const attempts = await Promise.all(
      Array.from({ length: 16 }, () => store.consumeAiReviewBudget(first, 12, 10)),
    );
    assert.equal(attempts.filter(Boolean).length, 10);
    assert.equal(await store.consumeAiReviewBudget(second, 12, 10), true);
    assert.equal(await store.consumeAiReviewBudget(second, 12, 10), true);
    assert.equal(await store.consumeAiReviewBudget(second, 12, 10), false);
    // A global-cap failure must not consume the second workspace's last eight slots.
    const more = await Promise.all(
      Array.from({ length: 10 }, () => store.consumeAiReviewBudget(second, 30, 10)),
    );
    assert.equal(more.filter(Boolean).length, 8);
  } finally {
    await store.close();
  }
});

Deno.test("AI budget shares the global cap between simultaneous workspaces", async () => {
  const store = await createTestStore();
  try {
    assert.equal(typeof store.consumeAiReviewBudget, "function");
    const workspaces = await Promise.all(Array.from({ length: 4 }, () => store.createWorkspace()));
    const attempts = await Promise.all(
      Array.from({ length: 24 }, (_, i) => store.consumeAiReviewBudget(workspaces[i % 4], 7, 10)),
    );
    assert.equal(attempts.filter(Boolean).length, 7);
  } finally {
    await store.close();
  }
});

Deno.test("AI quota uses the database UTC day and storage failures roll back then propagate", async () => {
  const client = await PGlite.create("memory://");
  try {
    for (const file of ["001_initial.sql", "002_ai_reviews.sql", "003_soft_delete_cases.sql"]) {
      await client.exec(await Deno.readTextFile(new URL(`./migrations/${file}`, import.meta.url)));
    }
    await client.exec("SET TIME ZONE 'Pacific/Honolulu'");
    let failWorkspace = true;
    type DB = ConstructorParameters<typeof Store>[0];
    const wrap = (c: any): DB => ({
      query: async (sql, params = []) => {
        if (failWorkspace && params.includes("workspace:example")) {
          throw new Error("storage failure");
        }
        return (await c.query(sql, params)).rows;
      },
      transaction: async (fn) => await c.transaction((tx: any) => fn(wrap(tx))),
      close: async () => {},
    });
    const store = new Store(wrap(client), "pglite");
    await assert.rejects(() => store.consumeAiReviewBudget("example", 1, 10), /storage failure/);
    failWorkspace = false;
    assert.equal(await store.consumeAiReviewBudget("example", 1, 10), true);
    const { rows } = await client.query<{ correct_day: boolean; requests: number }>(
      "SELECT day = (now() AT TIME ZONE 'UTC')::date AS correct_day, requests FROM ai_review_daily_usage",
    );
    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row.correct_day && row.requests === 1));
  } finally {
    await client.close();
  }
});
