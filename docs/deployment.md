# Deployment

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

Vercel has `clearpathfinancial.xyz` and `www.clearpathfinancial.xyz` attached, with `www` configured to redirect to the apex using HTTP 308. Porkbun has an apex ALIAS and a `www` CNAME pointing to `3ff9121296dae5db.vercel-dns-017.com`, both with a 600-second TTL. The saved records return Vercel addresses from Porkbun's authoritative servers. Registry RDAP confirms registration at 2026-11-04 03:42:56 UTC, the four Porkbun nameservers, and no client/server DNS hold. The `.xyz` registry DNS still returns NXDOMAIN. DNS and TLS verification for the custom domain are pending, so use the Vercel fallback above.

## Hosted verification

The hosted smoke test passed through the Vercel proxy against Neon on API revision `03gmk0t4mxa8`. It covered a new submission, blocked approval, a change request, revision, approval, stale-revision conflict, persistence, and workspace isolation. Initial demo workspace creation took 13.5 seconds in this run. The release uses sequential seeding after a parallel seeding attempt returned HTTP 500.

For a release check, confirm that `/api/health` returns `storage: postgres` directly and through the web proxy. Open a fresh workspace, submit and revise copy, approve the exact revision, and reload. A second browser workspace should see its own cases.
