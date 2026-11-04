# Submitter Fix Patterns Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development in independent file lanes. User approved implementation and main integration; proceed without another approval checkpoint.

**Goal:** Replace the duplicate submitter attention/journey panels with an attractive, truthful reason chart that filters the existing server-paged table.

**Architecture:** Shared contracts define fixed reason identities, labels, source and count. The model uses one reason-membership expression for counts and the optional queue filter, scoped to current revisions. A focused visual component receives the cohort summary; the existing queue owns selection and navigation.

**Tech Stack:** Next.js/React, Deno/Fastify, PostgreSQL/PGlite, TypeScript; no new dependencies.

**Spec:** docs/superpowers/specs/2026-11-04-fix-patterns-design.md (approved Fix patterns variant; bar styling to be more visually distinctive).

## Global constraints

- Canonical main /Users/sam/Developer/clearpath/clearpath-frontend; root alone commits/pushes. Preserve .claude/ local files. No shared database resets or demo-data mutation for testing.
- Current missing-information checks and actual current reviewer requests only. Legacy prose/manual/freeform requests -> Other reviewer feedback; inconsistent missing sources -> Details unavailable. No inferred classifications, risk scores or approvals.
- Count distinct cases per reason and distinct attention total; reasons may overlap. Counts share search/product scope, never table page/status/sort.
- Existing row menus/actions and reviewer dashboard remain. Remove homepage journey/preview affordances; keep case history. Server search/filter/sort/paging and return-scroll behavior remain.
- User approved core direction; root decides implementation details and runs independent review. No new infrastructure or migration expected. No hosted deployment in this scope.

## Fixed interfaces

Create packages/contracts/fix-patterns.ts, re-export from mod.ts:
- FixPatternSource = 'missing_information' | 'reviewer_request' | 'unavailable'.
- FixPattern = { id: string; label: string; description: string; source: FixPatternSource; count: number }.
- FixPatternSummary = { total: number; reasons: FixPattern[] }.
- fixReasonDefinitions: readonly definitions without count; each id/label/description/source.
- IDs: missing:<known-rule-id>, request:<known-rule-id>, other_feedback, details_unavailable. Known rule IDs are review-context, offer-match, card-intro-label, card-promo-terms, loan-repayment, approval-claims. Export isFixReasonId(value: unknown): value is string.
- DashboardResponse.fixPatterns: FixPatternSummary | null; null for reviewer and scope=page. Keep submitterAttention property as null for compatibility if removing it would expand the change; stop computing unused attention rows.
- DashboardQuery.reason: optional allowlisted string; requires role=submitter, view=needs_attention, status=all. Never interpolate raw query data into SQL.
- FixPatternsChart props: { summary: FixPatternSummary | null; selectedReason: string | null; loading: boolean; error: string | null; onSelect(reason: string | null): void; onRetry(): void }.
- DashboardFilters.reason: string | null, default null; persists in queue context and request only for valid submitter Needs attention view.

## Review focus

- Duplicate check/request items count case once; multiple reasons do not inflate total.
- Earlier requests, unconfirmed automated findings and manual concerns outside current attention statuses cannot become current submitter tasks.
- Unknown/legacy sources remain accessible with honest fallback and match table counts.
- Search/product changes hide stale chart data; page/sort updates preserve valid summary, mutations refresh it.
- Selecting/clearing reasons, switching tabs/roles and returning from a case preserve coherent filters and stable scroll.

### Task 1: API and reason memberships (backend agent)
Files: packages/contracts/fix-patterns.ts, packages/contracts/mod.ts, packages/models/fix-patterns.ts if useful, packages/models/mod.ts, packages/models/*test.ts, apps/api/test/dashboard_api_test.ts.
- [x] Add meaningful failing model/API tests for overlapping reasons, legacy/manual/freeform fallbacks, current-revision exclusion, missing-source fallback, search/product scope, pagination consistency and invalid reason/role/view combinations.
- [x] Implement interfaces above and aggregate/filter using identical reason memberships. Avoid hydrating all details or N+1 queries; keep row guidance page-only.
- [x] Run focused tests and deno check; report exact commands/results and changed files. Do not commit.

### Task 2: Chart component (visual agent)
Files: apps/web/src/components/submissions/fix-patterns-chart.tsx and fix-patterns-chart.module.css only.
- [x] Implement Fixed interfaces chart with source-labelled textured bands, shared count scale, crisp cap/selected edge and restrained action-driven transitions. No perpetual animation. Neutral dark surfaces/deep-purple selection; amber/blue source marks, unavailable neutral.
- [x] Top four reasons with expansion, selected reason stays visible, source explanation and multiple-membership note. All-zero, loading, error/retry and selected-but-vanished reason remain truthful.
- [x] Native buttons, aria-pressed, keyboard/touch, reduced-motion and narrow layout. Use usePendingHeight to avoid collapse while replacing chart results.
- [x] Typecheck when shared contracts land. No mirror tests for CSS. Report design rationale and file boundary; do not integrate or commit.

### Task 3: Queue integration (integration agent)
Files: apps/web/src/components/review-queue.tsx, dashboard/queue-row-actions.tsx, dashboard CSS where necessary, apps/web/src/lib/dashboard.ts, use-dashboard.ts, queue-context.ts, scripts/dashboard_test.ts, scripts/queue_context_test.ts. Old submitter-dashboard component/CSS may be removed if unused; do not delete shared journey code.
- [x] Add reason state parsing/request/storage tests and implement filters/hook summary retention. Same scoped summary is held while paging; no stale sources after mutations/search/product changes.
- [x] Replace both hero panels with FixPatternsChart. Remove abandoned selected-case fetching and Preview journey row action/state. Preserve selectedId only where review-map/return context still needs it.
- [x] Chart selection sets needs_attention/status all/reason and resets cursor. Clearing reason stays needs_attention. All/awaiting/approved tabs clear reason. Visible removable chip; selected missing reason gets an honest zero-result state.
- [x] Preserve scroll geometry/return anchor and row mutations; do not scroll to table on ordinary filter selection. Verify changed routing/query paths and focused tests/typecheck. Do not commit.

### Task 4: Root verification and independent review
- [x] Review each lane, run npm test, npm run check and npm run build. Focus independent reviewer on SQL membership/return continuity/role regressions.
- [x] Browser-check local actual legacy data, selecting reasons, product/search reset, pagination/row return, mobile and reduced motion. Use isolated in-memory fixtures for structured-request tests, not shared demo mutations.
- [x] Resolve review issues, commit small coherent pieces on main, push and update current-state handoff. State source-vs-deployment boundary accurately.

## Progress ledger

- Baseline 2b7c845; main/origin main synchronized. Design approved; no repeated approval gate. Parallel lanes have disjoint ownership.

- Backend/contracts: caa1149. Frontend/chart/queue: 3fb862f. No new dependency, migration or data reset.
- Three independent implementation lanes completed; independent review identified one malformed-check fallback bug. Normalized non-array checks in row counts and guidance; null/object/string/number/boolean regression passed and scoped re-review confirmed resolution.
- Final verification: npm test — 222 passed; npm run check — passed; npm run build — passed; git diff --check — passed. Backend regression rerun after the review fix; frontend unchanged after successful build.
- Local browser: actual 50-case cohort, 18 attention cases; overlapping reason counts remain truthful. Reason selection, page 2, case return to the same page, expansion/collapse preserving selected reason, product filter causing an honest zero-result selection, reset, keyboard selection and tab clearing verified. Mobile chart retained at 390px with scrollWidth=390; temporary viewport reset and original Reviewer role restored. Reduced-motion stylesheet and native button semantics reviewed.
- No hosted deployment performed. Canonical local main serves the change; push is the final integration step.
