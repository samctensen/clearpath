import { strict as assert } from "node:assert";
import { createTestStore } from "@clearpath/models";
import { analyze, offers, POLICY_VERSION } from "@clearpath/checks";
import type { CaseDetail, CaseSummary, DashboardResponse } from "@clearpath/contracts";
import { createApiServer } from "../src/server.ts";

Deno.test("delete endpoint enforces role, workspace, revision and approval guards", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    cookieSecret: "a".repeat(32),
  });
  try {
    const initial = await app.inject({ method: "GET", url: "/api/cases" });
    const cookie = initial.headers["set-cookie"] as string;
    const cases = initial.json<CaseSummary[]>();
    const ready = cases.find((item) => item.status === "ready_for_review")!;
    const approved = cases.find((item) => item.status === "approved")!;
    const headers = { cookie, "content-type": "application/json", "x-demo-role": "submitter" };
    const url = `/api/cases/${ready.id}/delete`;
    for (const role of [undefined, "reviewer"]) {
      const forbidden = await app.inject({
        method: "POST",
        url,
        headers: {
          cookie,
          "content-type": "application/json",
          ...(role ? { "x-demo-role": role } : {}),
        },
        payload: { expectedRevision: 1 },
      });
      assert.equal(forbidden.statusCode, 403);
    }
    const other = await app.inject({ method: "GET", url: "/api/cases" });
    const isolated = await app.inject({
      method: "POST",
      url,
      headers: { ...headers, cookie: other.headers["set-cookie"] as string },
      payload: { expectedRevision: 1 },
    });
    assert.equal(isolated.statusCode, 404);
    for (
      const payload of [{}, { expectedRevision: 0 }, { expectedRevision: "1" }, {
        expectedRevision: 1,
        role: "submitter",
      }]
    ) {
      assert.equal((await app.inject({ method: "POST", url, headers, payload })).statusCode, 400);
    }
    const stale = await app.inject({
      method: "POST",
      url,
      headers,
      payload: { expectedRevision: 2 },
    });
    assert.equal(stale.statusCode, 409);
    const blocked = await app.inject({
      method: "POST",
      url: `/api/cases/${approved.id}/delete`,
      headers,
      payload: { expectedRevision: 1 },
    });
    assert.equal(blocked.statusCode, 422);
    assert.equal(blocked.json().error.code, "blocked");
    const detail =
      (await app.inject({ method: "GET", url: `/api/cases/${ready.id}`, headers: { cookie } }))
        .json<CaseDetail>();
    const revised = await app.inject({
      method: "POST",
      url: `/api/cases/${ready.id}/revisions`,
      headers,
      payload: { expectedRevision: 1, input: detail.revisions.at(-1)!.input },
    });
    assert.equal(revised.statusCode, 200);
    assert.equal(
      (await app.inject({ method: "POST", url, headers, payload: { expectedRevision: 1 } }))
        .statusCode,
      409,
    );
    const deleted = await app.inject({
      method: "POST",
      url,
      headers,
      payload: { expectedRevision: 2 },
    });
    assert.equal(deleted.statusCode, 200);
    assert.deepEqual(deleted.json(), { deleted: true, id: ready.id });
    assert.equal(
      (await app.inject({ method: "POST", url, headers, payload: { expectedRevision: 2 } }))
        .statusCode,
      404,
    );
    for (const suffix of ["", "/ai-review?revision=1", "/ai-review?revision=2"]) {
      assert.equal(
        (await app.inject({
          method: "GET",
          url: `/api/cases/${ready.id}${suffix}`,
          headers: { cookie },
        })).statusCode,
        404,
      );
    }
    const mutations = [
      { path: "revisions", role: "submitter", body: { input: detail.revisions.at(-1)!.input } },
      {
        path: "decision",
        role: "reviewer",
        body: { decision: "request_changes", note: "Feedback" },
      },
      {
        path: "dispositions",
        role: "reviewer",
        body: { ruleId: "test", action: "confirmed", reason: "Review" },
      },
      {
        path: "manual-findings",
        role: "reviewer",
        body: { title: "Concern", quote: "Copy", reason: "Review" },
      },
      {
        path: "manual-findings/missing/resolve",
        role: "reviewer",
        body: { resolution: "Resolved" },
      },
      { path: "ai-review", role: "reviewer", body: {} },
    ];
    for (const mutation of mutations) {
      const response = await app.inject({
        method: "POST",
        url: `/api/cases/${ready.id}/${mutation.path}`,
        headers: { ...headers, "x-demo-role": mutation.role },
        payload: { expectedRevision: 2, ...mutation.body },
      });
      assert.equal(response.statusCode, 404, mutation.path);
    }
    const remaining = (await app.inject({ method: "GET", url: "/api/cases", headers: { cookie } }))
      .json<CaseSummary[]>();
    assert.equal(remaining.length, cases.length - 1);
    assert.ok(remaining.every((item) => item.id !== ready.id));
    const dashboard =
      (await app.inject({ method: "GET", url: "/api/dashboard", headers: { cookie } })).json<
        DashboardResponse
      >();
    assert.equal(dashboard.workspaceTotal, remaining.length);
    assert.equal(dashboard.overview.total, remaining.length);
    assert.equal(
      dashboard.overview.counts.ready_for_review,
      cases.filter((item) => item.status === "ready_for_review").length - 1,
    );
    for (const rows of [dashboard.rows, dashboard.cohort, dashboard.overview.actionable]) {
      assert.ok(rows.every((item) => item.id !== ready.id));
    }
  } finally {
    await app.close();
    await store.close();
  }
});

Deno.test("deleting every case leaves the workspace empty without reseeding either list endpoint", async () => {
  const store = await createTestStore();
  const app = await createApiServer({
    store,
    analyze,
    offers,
    policyVersion: POLICY_VERSION,
    cookieSecret: "a".repeat(32),
  });
  try {
    const initial = await app.inject({ method: "GET", url: "/api/cases" });
    const cookie = initial.headers["set-cookie"] as string;
    const headers = { cookie, "content-type": "application/json", "x-demo-role": "submitter" };
    for (const item of initial.json<CaseSummary[]>()) {
      let revision = item.revision;
      if (item.status === "approved") {
        const detail =
          (await app.inject({ method: "GET", url: `/api/cases/${item.id}`, headers: { cookie } }))
            .json<CaseDetail>();
        const revised = await app.inject({
          method: "POST",
          url: `/api/cases/${item.id}/revisions`,
          headers,
          payload: { expectedRevision: revision, input: detail.revisions.at(-1)!.input },
        });
        assert.equal(revised.statusCode, 200);
        revision++;
      }
      const deleted = await app.inject({
        method: "POST",
        url: `/api/cases/${item.id}/delete`,
        headers,
        payload: { expectedRevision: revision },
      });
      assert.equal(deleted.statusCode, 200, item.status);
    }
    for (
      const url of ["/api/dashboard", "/api/cases", "/api/dashboard?status=approved", "/api/cases"]
    ) {
      const response = await app.inject({ method: "GET", url, headers: { cookie } });
      assert.equal(response.statusCode, 200);
      assert.equal(response.headers["set-cookie"], undefined);
      if (url.startsWith("/api/dashboard")) {
        const dashboard = response.json<DashboardResponse>();
        assert.equal(dashboard.workspaceTotal, 0);
        assert.deepEqual(dashboard.rows, []);
        assert.deepEqual(dashboard.cohort, []);
        assert.deepEqual(dashboard.overview, {
          total: 0,
          openCount: 0,
          counts: { ready_for_review: 0, needs_information: 0, changes_requested: 0, approved: 0 },
          actionable: [],
          nextLaunchDate: null,
          overdueCount: 0,
        });
      } else assert.deepEqual(response.json(), []);
    }
  } finally {
    await app.close();
    await store.close();
  }
});
