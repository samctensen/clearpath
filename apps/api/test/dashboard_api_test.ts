import { strict as assert } from "node:assert";
import { createTestStore } from "@clearpath/models";
import { analyze, offers, POLICY_VERSION } from "@clearpath/checks";
import type { DashboardResponse } from "@clearpath/contracts";
import { createApiServer } from "../src/server.ts";

Deno.test("dashboard endpoint validates filters, preserves cohorts and never reseeds empty filtered results", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    cookieSecret: "a".repeat(32),
  });
  try {
    const initial = await app.inject({ method: "GET", url: "/api/dashboard?today=2026-11-16" });
    assert.equal(initial.statusCode, 200);
    assert.equal(initial.headers["cache-control"], "private, no-store");
    const body = initial.json<DashboardResponse>();
    assert.equal(body.rows.length, 6);
    assert.equal(body.workspaceTotal, 6);
    assert.equal(body.overview.overdueCount, 5);
    const cookie = initial.headers["set-cookie"] as string;
    const head = await app.inject({ method: "HEAD", url: "/api/dashboard", headers: { cookie } });
    assert.equal(head.statusCode, 200);
    assert.equal(head.body, "");
    let dashboardCalls = 0;
    const original = store.dashboard.bind(store);
    store.dashboard = (workspace, query) => {
      dashboardCalls++;
      return original(workspace, query);
    };
    const filtered = await app.inject({
      method: "GET",
      url:
        "/api/dashboard?product=card&status=changes_requested&q=NORTHSTAR&sort=title&direction=desc&today=2026-11-16",
      headers: { cookie },
    });
    assert.equal(filtered.statusCode, 200);
    assert.equal(dashboardCalls, 1);
    const result = filtered.json<DashboardResponse>();
    assert.equal(result.rows.length, 1);
    assert.equal(result.cohort.length, 1);
    assert.equal(result.workspaceTotal, 6);
    assert.equal(result.rows[0].status, "changes_requested");
    assert.equal(result.rows[0].productId, "card");
    const empty = await app.inject({
      method: "GET",
      url: "/api/dashboard?q=not-present&today=2026-11-16",
      headers: { cookie },
    });
    assert.equal(empty.statusCode, 200);
    assert.equal(empty.json<DashboardResponse>().rows.length, 0);
    assert.equal(empty.json<DashboardResponse>().workspaceTotal, 6);
    assert.equal(empty.headers["set-cookie"], undefined);
    const restored = await app.inject({
      method: "GET",
      url: "/api/dashboard",
      headers: { cookie },
    });
    assert.deepEqual(
      restored.json<DashboardResponse>().cohort.map((item) => item.id),
      body.cohort.map((item) => item.id),
    );
    for (
      const suffix of [
        "product=bad",
        "status=bad",
        "sort=createdAt",
        "direction=sideways",
        "role=admin",
        "today=2026-02-30",
        "today=not-a-date",
        "q=" + "x".repeat(201),
        "product=card&product=mortgage",
        "sort=launchDate%3BDROP%20TABLE%20cases",
        "unexpected=true",
      ]
    ) {
      const invalid = await app.inject({
        method: "GET",
        url: "/api/dashboard?" + suffix,
        headers: { cookie },
      });
      assert.equal(invalid.statusCode, 400, suffix);
      assert.equal(invalid.json().error.code, "invalid");
    }
    const other = await app.inject({ method: "GET", url: "/api/dashboard" });
    assert.ok(
      other.json<DashboardResponse>().rows.every((item) =>
        !body.rows.some((existing) => existing.id === item.id)
      ),
    );
    const legacy = await app.inject({ method: "GET", url: "/api/cases", headers: { cookie } });
    assert.equal(legacy.statusCode, 200);
    assert.ok(Array.isArray(legacy.json()));
    assert.equal(legacy.json().length, 6);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("dashboard recovers an actually empty demo workspace", async () => {
  const store = await createTestStore();
  const deps = {
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    cookieSecret: "a".repeat(32),
  };
  const emptyApp = await createApiServer({ ...deps, seed: false });
  const app = await createApiServer(deps);
  try {
    const empty = await emptyApp.inject({ method: "GET", url: "/api/dashboard" });
    assert.equal(empty.json<DashboardResponse>().workspaceTotal, 0);
    const recovered = await app.inject({
      method: "GET",
      url: "/api/dashboard?q=not-present",
      headers: { cookie: empty.headers["set-cookie"] as string },
    });
    assert.equal(recovered.statusCode, 200);
    assert.equal(recovered.json<DashboardResponse>().rows.length, 0);
    assert.equal(recovered.json<DashboardResponse>().workspaceTotal, 6);
    assert.ok(recovered.headers["set-cookie"]);
  } finally {
    await emptyApp.close();
    await app.close();
    await store.close();
  }
});
