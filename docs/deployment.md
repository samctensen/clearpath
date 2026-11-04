# Deployment

- [ClearPath demo](https://clearpathfinancial.xyz)
- [Web fallback on Vercel](https://clearpath-review-psi.vercel.app)
- [Deno Deploy API health](https://clearpath-api.samctensen.deno.net/api/health)
- Vercel project `clearpath-review` in team `sam-christensens-projects-78648ebe`
- Deno Deploy application `samctensen/clearpath-api`
- Neon project `ancient-bar-07154006`, database `clearpath`, AWS us-west-2

## Web and API settings

The Vercel root is `apps/web`, with access to the root npm workspace and shared contracts. The build uses `API_ORIGIN=https://clearpath-api.samctensen.deno.net`. The initial deployment used an inline source bundle. Git-based deployments require a GitHub connection to the Vercel project.

The Deno Deploy source bundle includes `deno.json`, `deno.lock`, `apps/api/src`, `packages/contracts`, `packages/checks`, and `packages/models`, with tests excluded. The build command is `deno cache apps/api/src/main.ts`, the dynamic entrypoint is `apps/api/src/main.ts`, and the region is US. The global Deno 2.5 CLI uploaded the bundle with `--prod` because the pinned 2.9.6 CLI repeated command arguments. Local verification and the [container build](../Dockerfile.api) use Deno 2.9.6.

Set `NODE_ENV=production`, `HOST=0.0.0.0`, and `WEB_ORIGIN=https://clearpathfinancial.xyz,https://clearpath-review-psi.vercel.app`. Configure `DATABASE_URL` and `COOKIE_SECRET` through the host's secret store. Production startup requires the database, cookie secret, and web origin. Apply the numbered SQL migration before starting the API with `npm run migrate` from the repository root.

Optional AI generation uses server-only `OPENAI_API_KEY`. `OPENAI_MODEL` defaults to `gpt-5.4-mini-2026-03-17`; `AI_REVIEW_DAILY_LIMIT` defaults to 50 attempts across all workspaces per UTC day, with a fixed 10-attempt workspace limit. The key was uploaded as a Deno Deploy secret and is never included in the frontend bundle. Migration `002_ai_reviews.sql` was applied to Neon before the AI deployment; it adds revision-scoped results and atomic daily usage counters. The provider has a 40-second timeout and no automatic retries. The Next.js proxy timeout is 60 seconds.

## Custom domain

Vercel has `clearpathfinancial.xyz` and `www.clearpathfinancial.xyz` attached. Porkbun has an apex ALIAS and a `www` CNAME pointing to `3ff9121296dae5db.vercel-dns-017.com`, both with a 600-second TTL. Public DNS now resolves correctly. After DNS propagation completed, a Vercel TLS certificate covering both names was issued with automatic renewal enabled. Verified HTTPS returns 200 at the apex; HTTP and HTTPS `www` requests redirect to `https://clearpathfinancial.xyz/` using HTTP 308.

## Hosted verification

The current API revision is `4ea8vbjc638z`, with AI prompt `clearpath-second-opinion-v5`. Frontend deployment `dpl_D4BL8sYSSo99BYi6cUcZ3bnHTRkr` is READY and aliased to the custom domain. The hosted AI smoke passed generation, cached reuse, unchanged approval, stale conflict, revision history, and isolation (6.08 seconds generation, 0.83 seconds cached). The ordinary hosted workflow also passed; fresh initialization was 1.5 seconds in that run. See the [AI release evaluation](reviews/2026-11-03-ai-review.md) for browser checks and limitations.

The preceding performance release `67j4axdcs13z` passed the full workflow and three concurrent fresh visitors with separate workspaces and chronological histories. Its initialization was 1.1 seconds in the workflow smoke.

The list now reads current-revision summaries directly and demo creation uses one atomic transaction of bulk inserts. Before this deployment, the additive `cases_workspace_updated_id_idx` index was applied to Neon. Three benchmark samples showed median fresh/returning list latency of 1.06/0.44 seconds. See the [before/after measurements](reviews/2026-11-03-list-performance.md), including sampling limits and the repeatable command.

For historical context, the earlier revision `03gmk0t4mxa8` used sequential seeding after a parallel seeding attempt returned HTTP 500. Its workflow checks passed but initialization took 13.5 seconds through the fallback domain and 11.4 seconds through the custom domain. The browser loaded all six cases through HTTPS after the certificate was issued.

A subsequent Brave browser check at 390 × 844 verified the queue, new-submission form, and review page. A newly entered launch date persisted, an unseen 18-month card promotion produced the expected mismatch, and approval remained disabled. The input was exercised through native segmented keyboard entry; the automation helper's date `fill` operation did not commit a value.

For a release check, confirm that `/api/health` returns `storage: postgres` directly and through the web proxy. Open a fresh workspace, submit and revise copy, approve the exact revision, and reload. A second browser workspace should see its own cases.
