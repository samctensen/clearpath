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

## Custom domain

Vercel has `clearpathfinancial.xyz` and `www.clearpathfinancial.xyz` attached. Porkbun has an apex ALIAS and a `www` CNAME pointing to `3ff9121296dae5db.vercel-dns-017.com`, both with a 600-second TTL. Public DNS now resolves correctly. After DNS propagation completed, a Vercel TLS certificate covering both names was issued with automatic renewal enabled. Verified HTTPS returns 200 at the apex; HTTP and HTTPS `www` requests redirect to `https://clearpathfinancial.xyz/` using HTTP 308.

## Hosted verification

The hosted smoke test passed through the Vercel proxy against Neon on API revision `03gmk0t4mxa8`. It covered a new submission, blocked approval, a change request, revision, approval, stale-revision conflict, persistence, and workspace isolation. Initial demo workspace creation took 13.5 seconds in this run. The release uses sequential seeding after a parallel seeding attempt returned HTTP 500.

After the certificate was issued, the same full workflow passed at `https://clearpathfinancial.xyz`, with a fresh workspace initialized in 11.4 seconds. The browser also loaded all six seeded cases through that HTTPS address.

A subsequent Brave browser check at 390 × 844 verified the queue, new-submission form, and review page. A newly entered launch date persisted, an unseen 18-month card promotion produced the expected mismatch, and approval remained disabled. The input was exercised through native segmented keyboard entry; the automation helper's date `fill` operation did not commit a value.

For a release check, confirm that `/api/health` returns `storage: postgres` directly and through the web proxy. Open a fresh workspace, submit and revise copy, approve the exact revision, and reload. A second browser workspace should see its own cases.
