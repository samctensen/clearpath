import assert from "node:assert/strict";

// Each sample creates one isolated workspace containing fictional demo records.
const origin = process.argv[2];
const samples = Number(process.argv[3] ?? 3);
if (!origin || !Number.isInteger(samples) || samples < 1 || samples > 10) {
  throw new Error("Usage: node scripts/benchmark-list.mjs https://your-demo-origin [samples:1-10]");
}

const results = [];
for (let sample = 1; sample <= samples; sample++) {
  let cookie = "";
  for (const phase of ["fresh", "returning"]) {
    const started = performance.now();
    const response = await fetch(`${origin}/api/cases`, {
      headers: { Cookie: cookie },
      signal: AbortSignal.timeout(60_000),
    });
    const headersMs = performance.now() - started;
    const body = await response.text();
    const totalMs = performance.now() - started;
    assert.equal(response.status, 200, `List request failed with HTTP ${response.status}`);
    const list = JSON.parse(body);
    assert.equal(list.length, 18, "a fresh demo workspace has eighteen cases");
    for (const item of list) {
      assert.equal(typeof item.title, "string");
      assert.equal(typeof item.revision, "number");
      for (const detailField of ["content", "analysis", "revisions", "events", "manualFindings", "dispositions"]) {
        assert.equal(detailField in item, false, `List must not include ${detailField}`);
      }
    }
    const nextCookie = response.headers.getSetCookie()[0];
    if (nextCookie) cookie = nextCookie.split(";")[0];
    assert.ok(cookie, "the request established an isolated workspace");
    const result = {
      sample, phase, status: response.status, count: list.length,
      headersMs: Math.round(headersMs), totalMs: Math.round(totalMs),
      bytes: Buffer.byteLength(body),
    };
    results.push(result);
    console.log(JSON.stringify(result));
  }
}

const median = (values) => {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
console.log(JSON.stringify({
  samples,
  medianFreshMs: median(results.filter((r) => r.phase === "fresh").map((r) => r.totalMs)),
  medianReturningMs: median(results.filter((r) => r.phase === "returning").map((r) => r.totalMs)),
}));
