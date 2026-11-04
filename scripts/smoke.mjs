import assert from "node:assert/strict";

// Creates fictional records in one fresh, isolated demo workspace.
const origin = process.argv[2];
if (!origin) throw new Error("Usage: node scripts/smoke.mjs https://your-demo-origin");
let cookie = "";
const request = async (path, body, role = "reviewer", expected = 200) => {
  const response = await fetch(`${origin}/api${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Origin: origin, Cookie: cookie, "x-demo-role": role,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const nextCookie = response.headers.getSetCookie()[0];
  if (nextCookie) cookie = nextCookie.split(";")[0];
  const result = await response.json();
  assert.equal(response.status, expected, JSON.stringify(result));
  return result;
};

const health = await request("/health");
assert.equal(health.ok, true);
const start = performance.now();
const queue = await request("/cases");
assert.equal(queue.length, 6, "a fresh visitor receives six demo cases");
console.log(`Fresh workspace ready in ${((performance.now() - start) / 1000).toFixed(1)}s (${health.storage}).`);
const { offers } = await request("/catalog");
const offer = offers.find((value) => value.id === "everyday-card");
const input = { title: "Deployment smoke check", productId: "card", offerId: offer.id,
  content: offer.approvedCopy.replace("12 months", "18 months"), format: "landing_page",
  publisher: "Fictional QA partner", launchDate: "2026-11-20", completeAsset: true,
  linksToApplication: false, substantiation: "" };
let detail = await request("/cases", input, "submitter", 201);
const path = `/cases/${detail.case.id}`;
assert.equal(detail.revisions.at(-1).analysis.checks.find((c) => c.ruleId === "offer-match").status, "finding");
await request(`${path}/decision`, { expectedRevision: 1, decision: "approve", note: "" }, "reviewer", 422);
await request(`${path}/dispositions`, { expectedRevision: 1, ruleId: "offer-match", action: "confirmed", reason: "Use the approved 12-month offer." });
await request(`${path}/decision`, { expectedRevision: 1, decision: "request_changes", note: "Correct the introductory period." });
detail = await request(`${path}/revisions`, { expectedRevision: 1, input: { ...input, content: offer.approvedCopy } }, "submitter");
assert.equal(detail.case.revision, 2);
assert.equal(detail.case.status, "ready_for_review");
detail = await request(`${path}/decision`, { expectedRevision: 2, decision: "approve", note: "Copy checked against the offer." });
assert.equal(detail.case.status, "approved");
await request(`${path}/decision`, { expectedRevision: 1, decision: "approve", note: "" }, "reviewer", 409);
detail = await request(path);
assert.equal(detail.case.status, "approved");
assert.equal(detail.events.filter((e) => e.type === "approved").length, 1);
const ownCookie = cookie;
cookie = "";
await request(path, undefined, "reviewer", 404);
assert.notEqual(cookie, ownCookie, "another visitor gets a different workspace");
console.log("PASS: new copy, blocked approval, change request, revision, approval, stale version, persistence, isolation.");
