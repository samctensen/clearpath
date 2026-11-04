# List performance investigation

Sam reported a slow initial list and proposed Redis or a lighter response. Measurements use synthetic, isolated visitor workspaces through the public HTTPS frontend. Dates in this record use Pacific time unless marked otherwise.

## Baseline

API revision: `03gmk0t4mxa8`. Three sequential samples, each a fresh-cookie GET `/api/cases` immediately followed by the same request with the returned cookie:

| Sample | Fresh visitor | Returning visitor | Response size | Rows |
| --- | ---: | ---: | ---: | ---: |
| 1 | 11,216 ms | 1,780 ms | 2,045 bytes | 6 |
| 2 | 10,211 ms | 1,745 ms | 2,045 bytes | 6 |
| 3 | 10,129 ms | 1,675 ms | 2,045 bytes | 6 |

Median: 10,211 ms fresh; 1,745 ms returning. This is a small observed sample, not a production percentile or load-capacity claim.

## Cause

The public response already contains only `CaseSummary` fields. The waste is in constructing those summaries: `Store.listCases` fetched IDs, then hydrated every case's complete revisions, dispositions, manual findings, and events. Six cases used 31 SQL statements. A returning queue request ran that list twice—once in workspace recovery and once in the route—plus the workspace lookup, for 63 application SQL statements.

First-visit initialization also called the full create/detail and decision/detail paths for six examples and two decisions. Much of the hydrated data was discarded.

Neon `EXPLAIN (ANALYZE, BUFFERS)` of the existing scoped ID query reported 0.067 ms execution at 137 cases. The evidence points to repeated database round trips and excess reads, rather than a large network response or expensive execution of that individual SQL query.

## Approach

- Query only the current revision's list metadata and check counts in one SQL statement.
- Read the list once per HTTP request; retain empty-workspace recovery without a second hydration.
- Initialize each demo workspace atomically with bulk inserts, preserving decision guards and event history.
- Add a workspace lookup/order index and keep visitor responses uncached across workspaces.
- Defer Redis: it would add invalidation and isolation concerns without removing first-visitor initialization work. Reconsider caching only if measurements after the query changes show a remaining read bottleneck.

The repeatable measurement command is `node scripts/benchmark-list.mjs https://clearpathfinancial.xyz 3`. Each sample creates six fictional records in a separate workspace. It prints timings and sizes, never cookies or record contents.

## Review and regression coverage

The backend implementation was delegated against a shared handoff, then reviewed by root and Claude Sonnet 5.5. Claude performed a read-only code review and did not run tests. It identified a real regression: PostgreSQL's transaction-wide `now()` made all bulk-seeded case timestamps equal, leaving queue order dependent on random IDs. Explicit chronological seed timestamps preserve the previous ordering, disposition order, and decision timing without adding database calls.

Regression tests execute against real PGlite with query counting at the database adapter boundary. The original list implementation failed with 11 SQL statements for two cases; the replacement uses one summary statement. The original API path failed with two list calls per returning request; the replacement uses one. Other tests cover current-revision summaries, workspace scoping, bounded bulk writes, approval guards, rollback, seed failures without cookies, and recovery of old empty workspaces.

The additive `(workspace_id, updated_at DESC, id)` index was applied to hosted Neon before deployment. A direct API-to-Neon integration probe verified JSONB objects, the seeded statuses and histories, three simultaneous visitors with 18 distinct cases, and cross-workspace 404s. These direct-probe timings are not used for the public-site comparison below.

## Hosted result

Deployed API revision: `67j4axdcs13z`. The frontend was unchanged. The same benchmark against `https://clearpathfinancial.xyz` returned:

| Sample | Fresh visitor | Returning visitor | Response size | Rows |
| --- | ---: | ---: | ---: | ---: |
| 1 | 2,875 ms | 511 ms | 2,045 bytes | 6 |
| 2 | 1,064 ms | 291 ms | 2,045 bytes | 6 |
| 3 | 922 ms | 437 ms | 2,045 bytes | 6 |

Median fresh-visitor latency fell from 10,211 ms to 1,064 ms (90% lower); returning-visitor latency fell from 1,745 ms to 437 ms (75% lower). The first request after deployment was slower than the other two. These are three observed requests per phase, not a p95, cold-start guarantee, browser rendering benchmark, or load-capacity test.

Returning list requests now use two application SQL statements: a workspace lookup and one scoped summary query, down from 63. Seed creation uses at most six bulk statements in one transaction, followed by the summary query; no detail objects are hydrated for the queue. The wire contract and response size remain unchanged.

Final local verification passed all 92 tests and both Deno/frontend type checks. A separate hosted concurrency probe created three fresh visitors simultaneously in 1,007 / 1,513 / 1,620 ms. All received six distinct cases, the same intended queue order, chronological approval histories, and JSONB objects; cross-workspace access returned 404. This is a small concurrency regression check, not a load test.

The full hosted workflow smoke also passed: new copy, blocked approval, change request, revision, approval, stale revision, persistence, and isolation. That run initialized its fresh workspace in 1.1 seconds. No Redis service was needed to reach these results. Full detail loading and mutation paths remain potential future profiling targets; this change focuses on the queue and first-visit initialization.
