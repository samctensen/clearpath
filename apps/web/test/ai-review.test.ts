import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { MutationObserver } from "@tanstack/react-query";
import type { AiReviewResponse } from "@clearpath/contracts";
import { aiReviewMutationKey, aiReviewMutationOptions } from "../src/lib/ai-review-mutation.ts";
import { ApiError } from "../src/lib/api.ts";
import { createQueryClient, queryKeys } from "../src/lib/query-client.ts";
import { resourceQueryOptions } from "../src/lib/resource-query.ts";

const casePath = "/cases/example";
const reviewPath = (revision: number) => `${casePath}/ai-review?revision=${revision}`;
const reviewKey = (revision: number) => queryKeys.resource(reviewPath(revision));

function savedReview(revision: number): AiReviewResponse {
  return {
    available: true,
    review: {
      revision,
      contentHash: `content-hash-${revision}`,
      model: "example-model",
      promptVersion: "1",
      createdAt: "2026-11-04T12:00:00Z",
      compliance: { summary: `Compliance review of revision ${revision}`, concerns: [], questions: [] },
      marketing: { summary: `Marketing review of revision ${revision}`, strengths: [], suggestions: [] },
    },
  };
}

type PendingRequest = {
  url: string;
  init: RequestInit;
  respond: (data: unknown, status?: number) => void;
};

function requests(t: TestContext) {
  const received: PendingRequest[] = [];
  const waiting: Array<(request: PendingRequest) => void> = [];
  let count = 0;
  t.mock.method(globalThis, "fetch", (input: string | URL | Request, init: RequestInit = {}) => {
    count += 1;
    return new Promise<Response>(resolve => {
      const request: PendingRequest = {
        url: String(input),
        init,
        respond: (data, status = 200) => resolve(Response.json(data, { status })),
      };
      const receiver = waiting.shift();
      if (receiver) receiver(request);
      else received.push(request);
    });
  });
  return {
    next: () => {
      const request = received.shift();
      return request ? Promise.resolve(request) : new Promise<PendingRequest>(resolve => waiting.push(resolve));
    },
    count: () => count,
  };
}

function queryClient(t: TestContext) {
  const client = createQueryClient();
  const defaults = client.getDefaultOptions();
  client.setDefaultOptions({
    queries: { ...defaults.queries, gcTime: Infinity, retryDelay: 0 },
    mutations: { ...defaults.mutations, gcTime: Infinity, retryDelay: 0 },
  });
  t.after(() => client.clear());
  return client;
}

test("AI generation completes after unsubscribe and caches only the requested revision", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const previous = savedReview(1);
  const newer = savedReview(3);
  client.setQueryData(reviewKey(1), previous);
  client.setQueryData(reviewKey(3), newer);
  const mutation = new MutationObserver(client, aiReviewMutationOptions(client));
  const unsubscribe = mutation.subscribe(() => {});
  t.after(unsubscribe);

  const generation = mutation.mutate({ path: casePath, revision: 2, role: "submitter" });
  const request = await http.next();
  assert.equal(request.url, "/api/cases/example/ai-review");
  assert.equal(request.init.method, "POST");
  assert.deepEqual(JSON.parse(String(request.init.body)), { expectedRevision: 2 });
  assert.equal(new Headers(request.init.headers).get("x-demo-role"), "submitter");
  unsubscribe();
  request.respond(savedReview(2));
  const result = await generation;

  assert.deepEqual(result, savedReview(2));
  assert.deepEqual(client.getQueryData(reviewKey(2)), savedReview(2));
  assert.strictEqual(client.getQueryData(reviewKey(1)), previous);
  assert.strictEqual(client.getQueryData(reviewKey(3)), newer);
  assert.equal(client.getQueryData(queryKeys.resource(`${casePath}/ai-review`)), undefined);
  assert.equal(client.getMutationCache().find({ mutationKey: aiReviewMutationKey })?.state.status, "success");
  assert.equal(http.count(), 1);
});

test("503 records AI availability without failing the saved submission", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const mutation = new MutationObserver(client, aiReviewMutationOptions(client));
  const generation = mutation.mutate({ path: casePath, revision: 2, role: "submitter" });
  (await http.next()).respond({ error: { message: "AI review is not configured" } }, 503);

  assert.deepEqual(await generation, { available: false, review: null });
  assert.deepEqual(client.getQueryData(reviewKey(2)), { available: false, review: null });
  assert.equal(mutation.getCurrentResult().isSuccess, true);
  assert.equal(http.count(), 1);
});

test("AI errors propagate without retrying or replacing a saved review", { timeout: 3_000 }, async t => {
  for (const status of [429, 502]) {
    await t.test(`HTTP ${status}`, async subtest => {
      const client = queryClient(subtest);
      const http = requests(subtest);
      const previous = savedReview(2);
      client.setQueryData(reviewKey(2), previous);
      const mutation = new MutationObserver(client, aiReviewMutationOptions(client));
      const generation = mutation.mutate({ path: casePath, revision: 2, role: "reviewer" });
      (await http.next()).respond({ error: { message: "AI generation failed" } }, status);

      await assert.rejects(generation, error => error instanceof ApiError && error.status === status);
      assert.equal(mutation.getCurrentResult().isError, true);
      assert.strictEqual(client.getQueryData(reviewKey(2)), previous);
      assert.equal(http.count(), 1);
    });
  }
});

test("a GET started before generation cannot overwrite the newly saved review", { timeout: 2_000 }, async t => {
  const client = queryClient(t);
  const http = requests(t);
  const reading = client.fetchQuery(resourceQueryOptions<AiReviewResponse>(reviewPath(2))).catch(() => undefined);
  const staleRead = await http.next();
  assert.equal(staleRead.init.method, "GET");
  assert.ok(staleRead.init.signal);
  const mutation = new MutationObserver(client, aiReviewMutationOptions(client));
  const generation = mutation.mutate({ path: casePath, revision: 2, role: "submitter" });
  (await http.next()).respond(savedReview(2));
  await generation;

  assert.equal(staleRead.init.signal.aborted, true);
  staleRead.respond({ available: true, review: null });
  await reading;
  await new Promise<void>(resolve => setImmediate(resolve));

  assert.deepEqual(client.getQueryData(reviewKey(2)), savedReview(2));
});
