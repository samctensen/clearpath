import { strict as assert } from "node:assert";
import { createTestStore } from "@clearpath/models";
import { createApiServer } from "../src/server.ts";
import type { Analysis } from "@clearpath/contracts";
const analysis: Analysis = {
  checks: [],
  policyVersion: "test",
  offerVersion: null,
  scope: "Text only",
};
const input = {
  title: "Sample submission",
  productId: "card",
  offerId: "everyday-card",
  content: "A sample credit card offer.",
  format: "email",
  publisher: "Example",
  launchDate: "2026-11-03",
  completeAsset: true,
  linksToApplication: null,
  substantiation: "",
};
Deno.test("API isolates visitors and validates revision, role and request body", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers: [],
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
    seed: false,
  });
  try {
    const created = await app.inject({
      method: "POST",
      url: "/api/cases",
      headers: { "content-type": "application/json" },
      payload: input,
    });
    assert.equal(created.statusCode, 201);
    const cookie = created.headers["set-cookie"] as string;
    assert.ok(cookie.includes("HttpOnly"));
    const id = created.json().case.id;
    assert.equal(created.json().events[0].actor, "reviewer");
    const other = await app.inject({ method: "GET", url: `/api/cases/${id}` });
    assert.equal(other.statusCode, 404);
    const invalid = await app.inject({
      method: "POST",
      url: `/api/cases/${id}/decision`,
      headers: { cookie, "content-type": "application/json", "x-demo-role": "submitter" },
      payload: { expectedRevision: 1, decision: "approve", note: "" },
    });
    assert.equal(invalid.statusCode, 403);
    const malformed = await app.inject({
      method: "POST",
      url: "/api/cases",
      headers: { cookie, "content-type": "application/json" },
      payload: "{",
    });
    assert.equal(malformed.statusCode, 400);
    const noJson = await app.inject({
      method: "POST",
      url: "/api/cases",
      headers: { cookie, "content-type": "text/plain" },
      payload: "abc",
    });
    assert.equal(noJson.statusCode, 400);
  } finally {
    await app.close();
    await store.close();
  }
});
Deno.test("API rejects disallowed origin and non-reviewable input", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers: [],
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
    seed: false,
  });
  try {
    const origin = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: { origin: "https://untrusted.example", "content-type": "application/json" },
      payload: input,
    });
    assert.equal(origin.statusCode, 403);
    const bad = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: { "content-type": "application/json" },
      payload: { ...input, launchDate: "2026-02-30" },
    });
    assert.equal(bad.statusCode, 400);
  } finally {
    await app.close();
    await store.close();
  }
});
Deno.test("new workspace is seeded once and returning cookie retains cases", async () => {
  const store = await createTestStore();
  const offers = (await import("../../../packages/checks/catalog.ts")).offers;
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers,
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
  });
  try {
    const first = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(first.statusCode, 200);
    assert.equal(first.json().length, 6);
    const cookie = first.headers["set-cookie"] as string;
    const second = await app.inject({ method: "GET", url: "/api/cases", headers: { cookie } });
    assert.equal(second.json().length, 6);
    assert.deepEqual(
      second.json().map((c: { id: string }) => c.id),
      first.json().map((c: { id: string }) => c.id),
    );
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("production does not trust local development origins", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers: [],
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
    production: true,
    seed: false,
  });
  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: { origin: "http://localhost:3000", "content-type": "application/json" },
      payload: input,
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("origin scheme must match the API origin", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers: [],
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
    production: true,
    seed: false,
  });
  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: {
        host: "api.example",
        origin: "https://api.example",
        "content-type": "application/json",
      },
      payload: input,
    });
    assert.equal(response.statusCode, 403);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("real analyzer seeds the expected demo review states", async () => {
  const { analyze, offers, POLICY_VERSION } = await import("@clearpath/checks");
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    cookieSecret: "a".repeat(32),
  });
  try {
    const response = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(response.statusCode, 200);
    const cases = response.json() as { status: string }[];
    assert.equal(cases.length, 6);
    for (
      const status of ["needs_information", "changes_requested", "approved", "ready_for_review"]
    ) assert.ok(cases.some((c) => c.status === status), `missing ${status}`);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("accepts schema-valid maximum length Unicode submissions", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers: [],
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
    seed: false,
  });
  try {
    const response = await app.inject({
      method: "POST",
      url: "/api/analyze",
      headers: { "content-type": "application/json" },
      payload: { ...input, content: "界".repeat(20000), substantiation: "界".repeat(4000) },
    });
    assert.equal(response.statusCode, 200);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("configured web origin is accepted by a separate API host and other origins are rejected", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers: [],
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
    production: true,
    seed: false,
    allowedOrigins: ["https://web.example"],
  });
  try {
    const request = { method: "POST" as const, url: "/api/analyze", payload: input };
    const allowed = await app.inject({
      ...request,
      headers: {
        host: "api.example",
        origin: "https://web.example",
        "content-type": "application/json",
      },
    });
    assert.equal(allowed.statusCode, 200);
    const rejected = await app.inject({
      ...request,
      headers: {
        host: "api.example",
        origin: "https://bad.example",
        "content-type": "application/json",
      },
    });
    assert.equal(rejected.statusCode, 403);
    assert.match(allowed.headers["set-cookie"] as string, /Max-Age=604800/);
    const missing = await app.inject({ method: "GET", url: "/api/no-such-route" });
    assert.equal(missing.statusCode, 404);
    assert.deepEqual(missing.json(), { error: { code: "not_found", message: "Route not found" } });
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("workspace seeding failure returns an error and does not issue a cookie", async () => {
  const store = await createTestStore();
  const offers = (await import("../../../packages/checks/catalog.ts")).offers;
  store.createSeededWorkspace = async () => ({
    ok: false,
    error: { code: "storage", message: "Unable to access storage" },
  });
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers,
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
  });
  try {
    const response = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(response.statusCode, 500);
    assert.equal(response.headers["set-cookie"], undefined);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("recovers an existing empty workspace by issuing a newly seeded workspace cookie", async () => {
  const store = await createTestStore();
  const offers = (await import("../../../packages/checks/catalog.ts")).offers;
  const deps = {
    store,
    analyze: () => analysis,
    offers,
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
  };
  const before = await createApiServer({ ...deps, seed: false });
  const app = await createApiServer(deps);
  try {
    const empty = await before.inject({ method: "GET", url: "/api/cases" });
    assert.equal(empty.json().length, 0);
    const response = await app.inject({
      method: "GET",
      url: "/api/cases",
      headers: { cookie: empty.headers["set-cookie"] as string },
    });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().length, 6);
    assert.ok(response.headers["set-cookie"]);
  } finally {
    await before.close();
    await app.close();
    await store.close();
  }
});

Deno.test("returning queue request loads summaries once", async () => {
  const store = await createTestStore();
  const offers = (await import("../../../packages/checks/catalog.ts")).offers;
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers,
    policyVersion: "test",
    cookieSecret: "a".repeat(32),
  });
  try {
    const initial = await app.inject({ method: "GET", url: "/api/cases" });
    const cookie = initial.headers["set-cookie"] as string;
    let calls = 0;
    const original = store.listCases.bind(store);
    store.listCases = (workspace) => {
      calls++;
      return original(workspace);
    };
    const response = await app.inject({ method: "GET", url: "/api/cases", headers: { cookie } });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().length, 6);
    assert.equal(calls, 1);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("demo initialization uses atomic workspace operation and retains review histories", async () => {
  const { analyze, offers, POLICY_VERSION } = await import("@clearpath/checks");
  const store = await createTestStore();
  let calls = 0;
  const original = store.createSeededWorkspace.bind(store);
  store.createSeededWorkspace = (plans) => {
    calls++;
    return original(plans);
  };
  const app = await createApiServer({
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    cookieSecret: "a".repeat(32),
  });
  try {
    const one = await app.inject({ method: "GET", url: "/api/cases" }),
      two = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(one.statusCode, 200);
    assert.equal(two.statusCode, 200);
    assert.equal(calls, 2);
    const approved = one.json().find((c: { status: string }) => c.status === "approved");
    const detail = await app.inject({
      method: "GET",
      url: `/api/cases/${approved.id}`,
      headers: { cookie: one.headers["set-cookie"] as string },
    });
    assert.equal(detail.statusCode, 200);
    assert.deepEqual(detail.json().events.map((e: { type: string }) => e.type), [
      "submitted",
      "approved",
    ]);
    const other = await app.inject({
      method: "GET",
      url: `/api/cases/${approved.id}`,
      headers: { cookie: two.headers["set-cookie"] as string },
    });
    assert.equal(other.statusCode, 404);
    const repeated = await app.inject({
      method: "POST",
      url: `/api/cases/${approved.id}/decision`,
      headers: { cookie: one.headers["set-cookie"] as string, "content-type": "application/json" },
      payload: { expectedRevision: 1, decision: "approve", note: "" },
    });
    assert.equal(repeated.statusCode, 409);
  } finally {
    await app.close();
    await store.close();
  }
});
