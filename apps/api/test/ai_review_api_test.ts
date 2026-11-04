import { strict as assert } from "node:assert";
import { createTestStore } from "@clearpath/models";
import type { AiReviewContent, Analysis, Offer, SubmissionInput } from "@clearpath/contracts";
import { createApiServer } from "../src/server.ts";
import { type AiReviewProvider, AiReviewProviderError } from "../src/ai-review.ts";
import * as config from "../src/config.ts";

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
  offerVersion: "1",
  scope: "Text only",
};
const offer: Offer = {
  id: "card",
  productId: "card",
  name: "Card",
  version: "1",
  description: "Card",
  terms: {},
  availableFrom: "2026-01-01",
  availableUntil: "2026-12-31",
  approvedCopy: input.content,
  notes: [],
};
const content: AiReviewContent = {
  compliance: { summary: "Review supplied facts.", concerns: [], questions: [] },
  marketing: { summary: "Clear copy.", strengths: [], suggestions: [] },
};
const generated = { content, model: "test-model", promptVersion: "v1" };
const headers = { "content-type": "application/json" };
type Deps = Parameters<typeof createApiServer>[0];
async function setup(aiReviewer?: AiReviewProvider, overrides: Partial<Deps> = {}) {
  const store = await createTestStore();
  const deps = {
    store,
    analyze: () => analysis,
    offers: [offer],
    policyVersion: "1",
    seed: false,
    aiReviewer,
    ...overrides,
  };
  const app = await createApiServer(deps);
  const created = await app.inject({ method: "POST", url: "/api/cases", headers, payload: input });
  assert.equal(created.statusCode, 201);
  const id = created.json().case.id as string;
  const post = (expectedRevision = 1, role = "reviewer") =>
    app.inject({
      method: "POST",
      url: `/api/cases/${id}/ai-review`,
      headers: { ...headers, "x-demo-role": role },
      payload: { expectedRevision },
    });
  const get = (revision = 1) =>
    app.inject({
      method: "GET",
      url: `/api/cases/${id}/ai-review?revision=${revision}`,
    });
  return {
    store,
    app,
    deps,
    id,
    post,
    get,
    close: async () => {
      await app.close();
      await store.close();
    },
  };
}

Deno.test("AI API reuses a saved review for both roles and does not change approval or queue data", async () => {
  let calls = 0;
  const f = await setup({
    generate: async (context) => {
      calls++;
      assert.deepEqual(context.revision.input, input);
      assert.deepEqual(context.offer, offer);
      return generated;
    },
  });
  try {
    const empty = await f.get();
    assert.equal(empty.statusCode, 200);
    assert.deepEqual(empty.json(), { available: true, review: null });
    const approve = await f.app.inject({
      method: "POST",
      url: `/api/cases/${f.id}/decision`,
      headers: { ...headers },
      payload: { expectedRevision: 1, decision: "approve", note: "" },
    });
    assert.equal(approve.statusCode, 200);
    const first = await f.post(1, "submitter");
    assert.equal(first.statusCode, 200);
    assert.equal(first.json().review.model, "test-model");
    assert.deepEqual((await f.post()).json(), first.json());
    assert.deepEqual((await f.get()).json(), first.json());
    assert.equal(calls, 1);
    assert.deepEqual(
      (await f.app.inject({
        method: "GET",
        url: `/api/cases/${f.id}`,
      })).json(),
      approve.json(),
    );
    const queue = await f.app.inject({
      method: "GET",
      url: "/api/cases",
    });
    assert.equal(queue.json()[0].status, "approved");
    assert.equal(calls, 1);
  } finally {
    await f.close();
  }
});

Deno.test("AI API validates revision before paid calls", async () => {
  let calls = 0;
  const f = await setup({
    generate: async () => {
      calls++;
      return generated;
    },
  });
  try {
    assert.equal((await f.get(99)).statusCode, 404);
    assert.equal((await f.post(99)).statusCode, 409);
    for (
      const query of ["", "?revision=0", "?revision=1.5", "?revision=wat", "?revision=1&revision=2"]
    ) {
      assert.equal(
        (await f.app.inject({
          method: "GET",
          url: `/api/cases/${f.id}/ai-review${query}`,
        })).statusCode,
        400,
      );
    }
    assert.equal((await f.post(0)).statusCode, 400);
    assert.equal(calls, 0);
  } finally {
    await f.close();
  }
});

Deno.test("AI API remains optional and reads saved reviews without configuration", async () => {
  const f = await setup();
  try {
    assert.deepEqual((await f.get()).json(), { available: false, review: null });
    assert.equal((await f.post()).statusCode, 503);
    const withProvider = await createApiServer({
      ...f.deps,
      aiReviewer: { generate: async () => generated },
    });
    try {
      const saved = await withProvider.inject({
        method: "POST",
        url: `/api/cases/${f.id}/ai-review`,
        headers: { ...headers },
        payload: { expectedRevision: 1 },
      });
      assert.equal(saved.statusCode, 200);
      assert.deepEqual((await f.get()).json(), { available: false, review: saved.json().review });
      assert.deepEqual((await f.post()).json(), { available: false, review: saved.json().review });
    } finally {
      await withProvider.close();
    }
  } finally {
    await f.close();
  }
});

Deno.test("AI API rejects historical cached generation but keeps historical reads", async () => {
  const f = await setup({ generate: async () => generated });
  try {
    assert.equal((await f.post()).statusCode, 200);
    const revised = await f.app.inject({
      method: "POST",
      url: `/api/cases/${f.id}/revisions`,
      headers: { ...headers, "x-demo-role": "submitter" },
      payload: {
        expectedRevision: 1,
        input: { ...input, content: "Changed card submission copy." },
      },
    });
    assert.equal(revised.statusCode, 200);
    assert.equal((await f.post()).statusCode, 409);
    assert.equal((await f.get()).json().review.revision, 1);
    assert.equal((await f.get(2)).json().review, null);
  } finally {
    await f.close();
  }
});

Deno.test("AI API rejects a slow completion after a new revision without holding the edit lock", async () => {
  const entered = Promise.withResolvers<void>(), finish = Promise.withResolvers<typeof generated>();
  const f = await setup({
    generate: () => {
      entered.resolve();
      return finish.promise;
    },
  });
  try {
    const request = f.post();
    await Promise.race([entered.promise, request.then((r) => assert.equal(r.statusCode, 200))]);
    const revised = await f.app.inject({
      method: "POST",
      url: `/api/cases/${f.id}/revisions`,
      headers: { ...headers, "x-demo-role": "submitter" },
      payload: { expectedRevision: 1, input: { ...input, content: "Revised credit card copy." } },
    });
    assert.equal(revised.statusCode, 200);
    finish.resolve(generated);
    assert.equal((await request).statusCode, 409);
    assert.equal((await f.get()).json().review, null);
    assert.equal((await f.get(2)).json().review, null);
  } finally {
    finish.resolve(generated);
    await f.close();
  }
});

Deno.test("AI API coalesces duplicate calls and clears failed in-flight work for retry", async () => {
  let calls = 0;
  const finish = Promise.withResolvers<typeof generated>();
  finish.promise.catch(() => {});
  const f = await setup({
    generate: () => {
      calls++;
      return calls === 1 ? finish.promise : Promise.resolve(generated);
    },
  });
  try {
    const requests = Array.from({ length: 4 }, () => f.post());
    // Give all injected requests time to join the in-flight promise.
    await new Promise((resolve) => setTimeout(resolve, 20));
    finish.reject(new Error("provider secret must never appear"));
    const failed = await Promise.all(requests);
    assert.ok(failed.every((r) => r.statusCode === 502));
    assert.ok(failed.every((r) => !r.body.includes("provider secret")));
    assert.equal(calls, 1);
    assert.equal((await f.post()).statusCode, 200);
    assert.equal(calls, 2);
  } finally {
    await f.close();
  }
});

Deno.test("AI API counts failed attempts against the global cap and provides safe timeout errors", async () => {
  let calls = 0;
  const f = await setup({
    generate: async () => {
      calls++;
      throw new AiReviewProviderError(504, "secret timeout context");
    },
  }, { aiReviewDailyLimit: 1 });
  try {
    const first = await f.post();
    assert.equal(first.statusCode, 504);
    assert.ok(!first.body.includes("secret timeout context"));
    assert.equal((await f.post()).statusCode, 429);
    assert.equal(calls, 1);
    assert.equal((await f.get()).json().review, null);
  } finally {
    await f.close();
  }
});

Deno.test("AI API enforces the workspace cap and reads cache after the cap", async () => {
  let calls = 0;
  const f = await setup({
    generate: async () => {
      calls++;
      return generated;
    },
  });
  try {
    assert.equal((await f.post()).statusCode, 200);
    for (let i = 0; i < 10; i++) {
      const created = await f.app.inject({
        method: "POST",
        url: "/api/cases",
        headers: { ...headers },
        payload: input,
      });
      const review = await f.app.inject({
        method: "POST",
        url: `/api/cases/${created.json().case.id}/ai-review`,
        headers: { ...headers },
        payload: { expectedRevision: 1 },
      });
      assert.equal(review.statusCode, i < 9 ? 200 : 429);
    }
    assert.equal((await f.post()).statusCode, 200);
    assert.equal(calls, 10);
  } finally {
    await f.close();
  }
});

Deno.test("AI API passes only an offer matching the saved ID product and version", async () => {
  const f = await setup({
    generate: async (context) => {
      assert.equal(context.offer, null);
      return generated;
    },
  }, { offers: [{ ...offer, version: "new" }] });
  try {
    assert.equal((await f.post()).statusCode, 200);
  } finally {
    await f.close();
  }
});

Deno.test("AI API fails closed when quota storage fails", async () => {
  let calls = 0;
  const f = await setup({
    generate: async () => {
      calls++;
      return generated;
    },
  });
  try {
    f.store.consumeAiReviewBudget = async () => {
      throw new Error("database secret");
    };
    const response = await f.post();
    assert.equal(response.statusCode, 500);
    assert.ok(!response.body.includes("database secret"));
    assert.equal(calls, 0);
  } finally {
    await f.close();
  }
});

Deno.test("AI API coalesces cache reads so a delayed cache miss cannot trigger a second paid call", async () => {
  let calls = 0;
  const providerEntered = Promise.withResolvers<void>(),
    finish = Promise.withResolvers<typeof generated>();
  const f = await setup({
    generate: () => {
      calls++;
      providerEntered.resolve();
      return finish.promise;
    },
  });
  const releaseCacheRead = Promise.withResolvers<void>();
  try {
    const first = f.post();
    await providerEntered.promise;
    const getReview = f.store.getAiReview.bind(f.store);
    const secondCacheRead = Promise.withResolvers<void>();
    f.store.getAiReview = async (...args) => {
      const result = await getReview(...args);
      secondCacheRead.resolve();
      await releaseCacheRead.promise;
      return result;
    };
    const second = f.post();
    await Promise.race([
      secondCacheRead.promise,
      new Promise((resolve) => setTimeout(resolve, 20)),
    ]);
    finish.resolve(generated);
    assert.equal((await first).statusCode, 200);
    releaseCacheRead.resolve();
    assert.equal((await second).statusCode, 200);
    assert.equal(calls, 1);
  } finally {
    finish.resolve(generated);
    releaseCacheRead.resolve();
    await f.close();
  }
});

Deno.test("AI configuration defaults to 50 attempts and rejects unsafe limits", () => {
  assert.ok("parseAiReviewDailyLimit" in config);
  const parse =
    (config as { parseAiReviewDailyLimit: (value?: string) => number }).parseAiReviewDailyLimit;
  assert.equal(parse(), 50);
  assert.equal(parse("7"), 7);
  for (const value of ["", "0", "-1", "1.5", "NaN", "Infinity", "2147483648", "1e2"]) {
    assert.throws(() => parse(value), /AI_REVIEW_DAILY_LIMIT/);
  }
});

Deno.test("AI server dependency limits cannot bypass quota validation", async () => {
  const f = await setup();
  try {
    for (const aiReviewDailyLimit of [0, -1, 1.5, NaN, Infinity, 2147483648]) {
      await assert.rejects(
        () => createApiServer({ ...f.deps, aiReviewDailyLimit }),
        /AI_REVIEW_DAILY_LIMIT/,
      );
    }
  } finally {
    await f.close();
  }
});

Deno.test("two AI API instances return the persisted winner and both attempts consume quota", async () => {
  const firstEntered = Promise.withResolvers<void>(), secondEntered = Promise.withResolvers<void>();
  const firstFinish = Promise.withResolvers<typeof generated>();
  const secondFinish = Promise.withResolvers<typeof generated>();
  const f = await setup({
    generate: () => {
      firstEntered.resolve();
      return firstFinish.promise;
    },
  }, { aiReviewDailyLimit: 2 });
  const secondApp = await createApiServer({
    ...f.deps,
    aiReviewer: {
      generate: () => {
        secondEntered.resolve();
        return secondFinish.promise;
      },
    },
  });
  try {
    const first = f.post();
    const second = secondApp.inject({
      method: "POST",
      url: `/api/cases/${f.id}/ai-review`,
      headers: { ...headers },
      payload: { expectedRevision: 1 },
    });
    await Promise.all([firstEntered.promise, secondEntered.promise]);
    firstFinish.resolve(generated);
    const winner = await first;
    assert.equal(winner.statusCode, 200);
    secondFinish.resolve({ ...generated, model: "losing-model" });
    const loser = await second;
    assert.equal(loser.statusCode, 200);
    assert.deepEqual(loser.json(), winner.json());
    const created = await f.app.inject({
      method: "POST",
      url: "/api/cases",
      headers: { ...headers },
      payload: input,
    });
    const capped = await secondApp.inject({
      method: "POST",
      url: `/api/cases/${created.json().case.id}/ai-review`,
      headers: { ...headers },
      payload: { expectedRevision: 1 },
    });
    assert.equal(capped.statusCode, 429);
  } finally {
    firstFinish.resolve(generated);
    secondFinish.resolve(generated);
    await secondApp.close();
    await f.close();
  }
});
