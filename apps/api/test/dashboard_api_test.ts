import { strict as assert } from "node:assert";
import { createTestStore } from "@clearpath/models";
import { analyze, offers, POLICY_VERSION } from "@clearpath/checks";
import { type DashboardResponse, decodeQueueCursor, encodeQueueCursor } from "@clearpath/contracts";
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
    // The default page size is 10, so a fresh workspace already pages.
    assert.equal(body.rows.length, 10);
    assert.equal(body.page.total, 18);
    assert.equal(body.page.hasNext, true);
    assert.equal(body.workspaceTotal, 18);
    assert.equal(body.overview!.overdueCount, 8);
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
    assert.equal(result.rows.length, 2);
    assert.equal(result.cohort!.length, 2);
    assert.equal(result.workspaceTotal, 18);
    assert.equal(result.rows[0].status, "changes_requested");
    assert.equal(result.rows[0].productId, "card");
    const empty = await app.inject({
      method: "GET",
      url: "/api/dashboard?q=not-present&today=2026-11-16",
      headers: { cookie },
    });
    assert.equal(empty.statusCode, 200);
    assert.equal(empty.json<DashboardResponse>().rows.length, 0);
    assert.equal(empty.json<DashboardResponse>().workspaceTotal, 18);
    assert.equal(empty.headers["set-cookie"], undefined);
    const restored = await app.inject({
      method: "GET",
      url: "/api/dashboard",
      headers: { cookie },
    });
    assert.deepEqual(
      restored.json<DashboardResponse>().cohort!.map((item) => item.id),
      body.cohort!.map((item) => item.id),
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
    assert.equal(legacy.json().length, 18);
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
    assert.equal(recovered.json<DashboardResponse>().workspaceTotal, 18);
    assert.ok(recovered.headers["set-cookie"]);
  } finally {
    await emptyApp.close();
    await app.close();
    await store.close();
  }
});

Deno.test("dashboard endpoint pages with cursors and refuses a cursor it never issued", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    cookieSecret: "a".repeat(32),
  });
  try {
    const first = await app.inject({ method: "GET", url: "/api/dashboard?limit=2&today=2026-11-16" });
    assert.equal(first.statusCode, 200);
    const firstBody = first.json<DashboardResponse>();
    const cookie = first.headers["set-cookie"] as string;
    assert.equal(firstBody.rows.length, 2);
    assert.equal(firstBody.page.total, 18);
    assert.equal(firstBody.page.from, 1);
    assert.equal(firstBody.page.to, 2);
    assert.equal(firstBody.page.hasPrev, false);
    assert.equal(firstBody.page.hasNext, true);

    const second = await app.inject({
      method: "GET",
      url: `/api/dashboard?limit=2&today=2026-11-16&scope=page&after=${
        encodeURIComponent(firstBody.page.endCursor!)
      }`,
      headers: { cookie },
    });
    assert.equal(second.statusCode, 200);
    const secondBody = second.json<DashboardResponse>();
    assert.equal(secondBody.page.from, 3);
    assert.equal(secondBody.page.hasPrev, true);
    // A client that already holds the chart data pays nothing to re-send it.
    assert.equal(secondBody.cohort, null);
    assert.equal(secondBody.overview, null);
    const overlap = secondBody.rows.filter((row) =>
      firstBody.rows.some((earlier) => earlier.id === row.id)
    );
    assert.deepEqual(overlap, []);

    const rejected = await app.inject({
      method: "GET",
      url: "/api/dashboard?after=not-a-real-cursor",
      headers: { cookie },
    });
    assert.equal(rejected.statusCode, 400);

    const conflicting = await app.inject({
      method: "GET",
      url: `/api/dashboard?after=${encodeURIComponent(firstBody.page.endCursor!)}&before=${
        encodeURIComponent(firstBody.page.endCursor!)
      }`,
      headers: { cookie },
    });
    assert.equal(conflicting.statusCode, 400);
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("dashboard rejects malformed cursor timestamps before SQL while preserving PostgreSQL precision", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store, analyze, offers, policyVersion: POLICY_VERSION, cookieSecret: "a".repeat(32),
  });
  try {
    const initial = await app.inject({ method: "GET", url: "/api/dashboard?sort=updatedAt" });
    assert.equal(initial.statusCode, 200);
    const cookie = initial.headers["set-cookie"] as string;
    const id = initial.json<DashboardResponse>().rows[0].id;
    const valid = "2026-11-04 10:20:30.123456+00";
    let dashboardCalls = 0;
    const dashboard = store.dashboard.bind(store);
    store.dashboard = (workspace, query) => {
      dashboardCalls++;
      return dashboard(workspace, query);
    };
    for (const malformed of [
      "garbage", "", "infinity", "2026-02-30T10:20:30Z",
      "2026-11-04T25:20:30Z", "2026-11-04T10:20:30+16:00", "0000-11-04T10:20:30Z",
    ]) {
      for (const field of ["createdAt", "key"] as const) {
        const encoded = encodeQueueCursor({ key: valid, createdAt: valid, id, [field]: malformed });
        for (const direction of ["after", "before"]) {
          const query = new URLSearchParams({ sort: "updatedAt", [direction]: encoded });
          const response = await app.inject({ method: "GET", url: `/api/dashboard?${query}`, headers: { cookie } });
          assert.equal(response.statusCode, 400, `${direction}.${field}: ${malformed}`);
          assert.equal(response.json().error.code, "invalid");
        }
      }
    }
    assert.equal(dashboardCalls, 0);
    for (const timestamp of [
      valid, "2026-11-04T10:20:30.123456Z", "2026-11-04 10:20:30+05",
      "2026-11-04 10:20:30.123456+0530", "2026-11-04T10:20:30.123456-07:00",
    ]) {
      const encoded = encodeQueueCursor({ key: timestamp, createdAt: timestamp, id });
      assert.equal(decodeQueueCursor(encoded).createdAt, timestamp);
      for (const direction of ["after", "before"]) {
        const query = new URLSearchParams({ sort: "updatedAt", [direction]: encoded });
        const response = await app.inject({ method: "GET", url: `/api/dashboard?${query}`, headers: { cookie } });
        assert.equal(response.statusCode, 200, timestamp);
      }
    }
  } finally {
    await app.close();
    await store.close();
  }
});
