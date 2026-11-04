import assert from "node:assert/strict";

// Creates fictional records and makes at most one paid AI generation in a fresh workspace.
const origin = process.argv[2];
if (!origin) throw new Error("Usage: node scripts/smoke-ai.mjs https://your-demo-origin");
let cookie = "";
const request = async (path, body, role = "reviewer", expected = 200) => {
  const response = await fetch(`${origin}/api${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Origin: origin, Cookie: cookie, "x-demo-role": role,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(65_000),
  });
  const nextCookie = response.headers.getSetCookie()[0];
  if (nextCookie) cookie = nextCookie.split(";")[0];
  const result = await response.json();
  assert.equal(response.status, expected, JSON.stringify(result));
  return result;
};
await request("/cases");
const { offers } = await request("/catalog");
const offer = offers.find((o) => o.id === "everyday-card");
const input = { title: "Hosted AI review check", productId: "card", offerId: offer.id,
  content: offer.approvedCopy.replace("12 months", "18 months"), format: "landing_page",
  publisher: "Fictional AI QA partner", launchDate: "2026-11-20", completeAsset: true,
  linksToApplication: false, substantiation: "" };
const created = await request("/cases", input, "submitter", 201);
const path = `/cases/${created.case.id}`;
const before = await request(`${path}/ai-review?revision=1`);
assert.equal(before.available, true, "server-side OpenAI reviewer must be configured");
assert.equal(before.review, null);
const start = performance.now();
const generated = await request(`${path}/ai-review`, { expectedRevision: 1 });
const generationMs = Math.round(performance.now() - start);
const review = generated.review;
assert.equal(review.revision, 1);
assert.equal(review.contentHash, created.revisions[0].contentHash);
assert.ok(review.compliance.summary);
assert.ok(review.marketing.summary);
assert.ok(review.model);
const repeatStart = performance.now();
const cached = await request(`${path}/ai-review`, { expectedRevision: 1 }, "submitter");
const cachedMs = Math.round(performance.now() - repeatStart);
assert.deepEqual(cached.review, review);
assert.deepEqual(await request(path), created, "AI must not change the review workflow or decision");
await request(`${path}/decision`, { expectedRevision: 1, decision: "approve", note: "" }, "reviewer", 422);
await request(`${path}/revisions`, { expectedRevision: 1, input: { ...input, content: offer.approvedCopy } }, "submitter");
await request(`${path}/ai-review`, { expectedRevision: 1 }, "reviewer", 409);
assert.deepEqual((await request(`${path}/ai-review?revision=1`)).review, review);
assert.equal((await request(`${path}/ai-review?revision=2`)).review, null);
cookie = "";
await request(`${path}/ai-review?revision=1`, undefined, "reviewer", 404);
console.log(JSON.stringify({ pass: true, generationMs, cachedMs, model: review.model,
  checks: "separate opinions, saved reuse, approval unchanged, stale conflict, revision history, isolation" }));
