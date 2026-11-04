# Build progress

ClearPath uses two deployable apps in one repository. The web app runs on Next.js and the API uses Deno, Fastify, and Postgres. The reviewed implementation is pushed to `codex/clearpath-review-workbench` in the existing private repository.

- Claude implemented the six-rule engine. The backend and frontend were built in parallel against shared contracts. The independent 53-case holdout review and Claude's final integration review were completed and their material fixes integrated. See the [implementation review](reviews/2026-11-03-implementation-review.md) and [holdout results](handoffs/holdout-report.md).
- The 86 local tests, Deno and frontend type checks, and Next.js production build pass. CodeGraph is initialized and healthy.
- The desktop browser walkthrough passed locally with a seeded change request, clean self-check, revision comparison, and approval. The hosted browser also saved a corrected revision and displayed approval for revision 2. A hosted Brave pass at 390 × 844 verified the queue, new-submission form, and review page without document overflow. Keyboard entry in the native date field saved November 20, 2026; the new submission computed the 18-month offer mismatch and kept approval disabled.
- Hosted testing caught a JSONB serialization difference between PGlite and Neon. Explicit text-to-JSONB casts fixed it. A later parallel seeding attempt returned HTTP 500, so the release uses sequential seeding.
- The full hosted smoke run passed on Deno Deploy revision `03gmk0t4mxa8` through Vercel and Neon. It covered new submissions, blocked approval, change requests, revisions, approval, stale-revision conflicts, persistence, and workspace isolation. Initial demo workspace creation took 13.5 seconds in the smoke run.
- Vercel has both custom domain names attached. Porkbun's authoritative DNS responds with Vercel addresses, while the `.xyz` registry still returns NXDOMAIN. Custom-domain DNS and TLS verification remain pending. Use the [Vercel demo](https://clearpath-review-psi.vercel.app) in the meantime.

See the [implementation plan](superpowers/plans/2026-11-03-clearpath.md) and [deployment notes](deployment.md).
