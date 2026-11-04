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
Deno.test("API validates revision, role and request body", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers: [],
    policyVersion: "test",
    seedCaseCount: 18,
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
    const id = created.json().case.id;
    assert.equal(created.json().events[0].actor, "reviewer");
    const invalid = await app.inject({
      method: "POST",
      url: `/api/cases/${id}/decision`,
      headers: { "content-type": "application/json", "x-demo-role": "submitter" },
      payload: { expectedRevision: 1, decision: "approve", note: "" },
    });
    assert.equal(invalid.statusCode, 403);
    const malformed = await app.inject({
      method: "POST",
      url: "/api/cases",
      headers: { "content-type": "application/json" },
      payload: "{",
    });
    assert.equal(malformed.statusCode, 400);
    const noJson = await app.inject({
      method: "POST",
      url: "/api/cases",
      headers: { "content-type": "text/plain" },
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
    seedCaseCount: 18,
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
Deno.test("the shared workspace is seeded once and every visitor sees it", async () => {
  const store = await createTestStore();
  const offers = (await import("../../../packages/checks/catalog.ts")).offers;
  const app = await createApiServer({
    store,
    analyze: () => analysis,
    offers,
    policyVersion: "test",
    seedCaseCount: 18,
  });
  try {
    const first = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(first.statusCode, 200);
    assert.equal(first.json().length, 18);
    const second = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(second.json().length, 18);
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
    seedCaseCount: 18,
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
    seedCaseCount: 18,
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
    seedCaseCount: 18,
  });
  try {
    const response = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(response.statusCode, 200);
    const cases = response.json() as { status: string }[];
    assert.equal(cases.length, 18);
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
    seedCaseCount: 18,
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
    seedCaseCount: 18,
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
    const missing = await app.inject({ method: "GET", url: "/api/no-such-route" });
    assert.equal(missing.statusCode, 404);
    assert.deepEqual(missing.json(), { error: { code: "not_found", message: "Route not found" } });
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("workspace seeding failure returns an error", async () => {
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
    seedCaseCount: 18,
  });
  try {
    const response = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(response.statusCode, 500);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("a workspace opened without seeding is never backfilled", async () => {
  const store = await createTestStore();
  const offers = (await import("../../../packages/checks/catalog.ts")).offers;
  const deps = {
    store,
    analyze: () => analysis,
    offers,
    policyVersion: "test",
    seedCaseCount: 18,
  };
  const unseeded = await createApiServer({ ...deps, seed: false });
  const seeded = await createApiServer(deps);
  try {
    assert.equal((await unseeded.inject({ method: "GET", url: "/api/cases" })).json().length, 0);
    // The shared workspace now exists and is deliberately empty, so a seeding
    // server must leave it alone rather than refill it under the visitor.
    const response = await seeded.inject({ method: "GET", url: "/api/cases" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().length, 0);
  } finally {
    await unseeded.close();
    await seeded.close();
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
    seedCaseCount: 18,
  });
  try {
    const initial = await app.inject({ method: "GET", url: "/api/cases" });
    let calls = 0;
    const original = store.listCases.bind(store);
    store.listCases = (workspace) => {
      calls++;
      return original(workspace);
    };
    const response = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().length, 18);
    assert.equal(calls, 1);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("demo initialization seeds once and a cold visitor resolves any case link", async () => {
  const { analyze, offers, POLICY_VERSION } = await import("@clearpath/checks");
  const store = await createTestStore();
  let calls = 0;
  const original = store.createSeededWorkspace.bind(store);
  store.createSeededWorkspace = (plans, workspaceId) => {
    calls++;
    return original(plans, workspaceId);
  };
  const app = await createApiServer({
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    seedCaseCount: 18,
  });
  try {
    const one = await app.inject({ method: "GET", url: "/api/cases" }),
      two = await app.inject({ method: "GET", url: "/api/cases" });
    assert.equal(one.statusCode, 200);
    assert.equal(two.statusCode, 200);
    // One shared workspace: the first request seeds it, later ones reuse it.
    assert.equal(calls, 1);
    const approved = one.json().find((c: { status: string }) => c.status === "approved");
    const detail = await app.inject({
      method: "GET",
      url: `/api/cases/${approved.id}`,
    });
    assert.equal(detail.statusCode, 200);
    assert.deepEqual(detail.json().events.map((e: { type: string }) => e.type), [
      "submitted",
      "approved",
    ]);
    // A pasted link carries only the case id, so a visitor arriving cold must
    // still resolve it rather than land in a workspace that never had it.
    const shared = await app.inject({
      method: "GET",
      url: `/api/cases/${approved.id}`,
    });
    assert.equal(shared.statusCode, 200);
    assert.equal(shared.json().case.id, approved.id);
    const repeated = await app.inject({
      method: "POST",
      url: `/api/cases/${approved.id}/decision`,
      headers: { "content-type": "application/json" },
      payload: { expectedRevision: 1, decision: "approve", note: "" },
    });
    assert.equal(repeated.statusCode, 409);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("demo reset returns the shared workspace to its seeded state", async () => {
  const { analyze, offers, POLICY_VERSION } = await import("@clearpath/checks");
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    seedCaseCount: 18,
  });
  try {
    type Row = { id: string; status: string; title: string };
    const list = async () => (await app.inject({ method: "GET", url: "/api/cases" })).json<Row[]>();
    const before = await list();
    assert.equal(before.length, 18);
    const open = before.find((c) => c.status === "ready_for_review")!;
    const deleted = await app.inject({
      method: "POST",
      url: `/api/cases/${open.id}/delete`,
      headers: { "content-type": "application/json", "x-demo-role": "submitter" },
      payload: { expectedRevision: 1 },
    });
    assert.equal(deleted.statusCode, 200);
    assert.equal((await list()).length, 17);

    const reset = await app.inject({
      method: "POST",
      url: "/api/demo/reset",
      headers: { "content-type": "application/json" },
      payload: {},
    });
    assert.equal(reset.statusCode, 200);
    assert.equal(reset.json().ok, true);
    const after = await list();
    assert.equal(after.length, 18);
    // A reset is a fresh seed, so the drifted case is gone rather than restored.
    assert.ok(after.every((c) => c.id !== open.id));
    assert.deepEqual(
      after.map((c) => c.title).sort(),
      before.map((c) => c.title).sort(),
    );
  } finally {
    await app.close();
    await store.close();
  }
});
