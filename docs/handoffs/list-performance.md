# List and initialization performance

Sam requests faster backend queries and suggests Redis or a light list response. Optimize and deploy the existing app; no Redis dependency unless measurement establishes a remaining need. Preserve exact-revision decisions and per-visitor isolation.

## Verified baseline

Production API revision `03gmk0t4mxa8`, web `https://clearpathfinancial.xyz`. Three sequential fresh-cookie GET `/api/cases` calls took 11,216 / 10,211 / 10,129 ms. Immediately repeated requests with the same cookie took 1,780 / 1,745 / 1,675 ms. Every response was 200, six rows, 2,045 bytes. The response already has only CaseSummary fields.

Root inspected the source through CodeGraph:

- `Store.listCases` selects IDs, then calls `getCase` for every ID. Each detail call reads cases, all revisions, dispositions, manual findings, and events. Six rows cost 31 queries.
- The API preHandler calls listCases to detect empty workspaces; the route calls it again. Returning requests therefore cost 63 application SQL queries including hasWorkspace.
- `seedWorkspace` calls the full createCase/detail and mutation/detail paths sequentially for six samples and two decisions. The first request performs much work whose response data is discarded.
- PostgreSQL adapter uses postgres.js with max 10 connections; PGlite is the real local/test database. JSONB values must use the established text-to-jsonb cast to avoid double serialization.
- The original schema has the unique `(case_id, number)` revision index but no case workspace lookup index. The numbered initial migration is idempotent and is applied explicitly in hosted production.

## Backend owner

Own packages/models and apps/api, including tests and migration SQL. Root owns scripts, docs, deployment, and hosted measurements. No frontend contract changes are needed for the list response.

1. Write a failing regression that proves listing does not hydrate case details, while checking current-revision metadata/counts, ordering, and workspace isolation against real PGlite. A narrow instrumented database boundary may count actual SQL queries while still executing them; avoid source-string tests.
2. Replace listCases with one parameterized summary SELECT joining cases to only the current revision, extracting the required JSON metadata and counting current findings/unknowns in SQL. Return the existing CaseSummary shape. Do not return content, full analysis, events, or histories.
3. Ensure GET `/api/cases` only loads the summary once per request, including the existing empty-workspace recovery path. Reuse the request's result or use a small existence query; never hydrate the list twice. Keep failures visible and cookie behavior correct.
4. Implement atomic demo workspace initialization using a small bounded number of SQL statements in one transaction, instead of invoking full detail hydration/mutation paths for every seed. Compute analyses/hashes before persistence and bulk insert the case/revision/event/decision records. Preserve the six examples, status distribution, policy snapshots, event history, approval guards, and separation of workspaces. Do not return seeded full details when only the workspace ID is needed.
5. Test all-or-nothing initialization, no issued cookie on failure, recovery of old empty workspaces, separate fresh visitors, and readable detail/decision histories. Avoid bypassing blocked approval in the seed API; invalid approval plans must not silently create an approved case.
6. Add justified non-destructive indexes for the scoped list path. Root will apply the exact index statement on Neon before deployment. Do not invent a new migration framework or alter existing records.

Report the failing-test evidence, changes, final test results, and exact migration statement. Do not deploy, commit, push, read .env.deploy, or print secrets. First provide a short proposed bulk-initialization interface/guard design so root can check scope while implementation proceeds on the independent summary query work.

## Completed handoff

Backend implementation and Claude co-review are complete. Root applied the additive index, deployed API revision `67j4axdcs13z`, and verified the public-site benchmark, full workflow, and three concurrent visitors. All 92 local tests and both type checks passed. See the [final performance report](../reviews/2026-11-03-list-performance.md) for measurements, the seed-ordering correction, and remaining limits.
