# Role-specific Workspaces Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Give submitters a feedback-and-revision workspace while preserving reviewer triage and exact-revision human decisions.
**Architecture:** Role-specific home composition on the existing route, shared shell/table primitives, small additions to the existing dashboard API, and one lazy-loaded case journey. Keep mutations in the current case/action controllers.
**Tech Stack:** Next.js/React/TypeScript, CSS Modules, Deno/Fastify, Postgres/PGlite, existing Deno tests.
**Spec:** ../specs/2026-11-04-role-workspaces-design.md
**Status:** Implemented and reviewed on canonical main, 2026-11-04. Hosted deployment is separate and was not performed in this implementation pass.

## Global constraints

- Main checkout: /Users/sam/Developer/clearpath/clearpath-frontend. Read AGENTS.md, CLAUDE.md, docs/handoffs/current-state.md and apps/web/AGENTS.md.
- Preserve existing reviewer map, neutral dark/deep-purple design, custom controls, card loading, mobile navigation and role-action confirmations.
- Demo roles share one workspace: Submissions / Workspace submissions, not personal ownership claims.
- No auth/ownership migration, invented history, financial metrics, launch activation, automated approval, or new infrastructure.
- Existing status values, revision-conflict checks, workspace isolation, soft deletion and approval scope remain unchanged.
- Server filtering/sorting/paging stays authoritative. No full-list fetch to power the new home.
- AI opinions remain optional, advisory and available to both roles; no automatic requests.
- Coordinate file ownership, use small commits, and keep reviewed work on main. One integration owner handles shared files and Git.

## Review focus

1. Old reviewer feedback must never become current-revision feedback after resubmission — tasks 1 and 4.
2. Manual concerns survive revisions and cannot be cleared by submitter UI — tasks 3 and 4.
3. Grouped filters, search and pagination must agree on totals across page boundaries — tasks 1 and 2.
4. Rapid role/selection changes or deletion cannot display another selection's history or retain actionable controls — tasks 2 and 3.
5. The first revision, empty results, long labels and mobile layouts need useful, accessible behavior without fabricated progress — tasks 3 and 5.

## File and interface ownership

| Work | Owner | Files |
| --- | --- | --- |
| Contracts/API | Backend agent | packages/contracts/mod.ts; new packages/contracts/submission-guidance.ts; packages/models/mod.ts; new packages/models/submission-guidance.ts; apps/api/test/dashboard_api_test.ts |
| Home/controller | Integration owner | apps/web/src/components/review-queue.tsx; apps/web/src/lib/dashboard.ts; apps/web/src/lib/use-dashboard.ts; scripts/dashboard_test.ts; components/workspace.tsx; components/dashboard/dashboard-shell.tsx; dashboard-user-menu.tsx; queue-row-actions.tsx; review-dashboard.module.css |
| Submitter view/journey | UI agent | new apps/web/src/components/submissions/ directory; new apps/web/src/lib/submission-journey.ts; new scripts/submission_journey_test.ts |
| Case feedback | Case agent | apps/web/src/components/case-review.tsx and case-review.module.css; new apps/web/src/components/submissions/submission-feedback.tsx |
| Integration/review | Integration owner + fresh Claude review | docs, task commands, browser checks |

The UI agent does not edit the case agent's submission-feedback file. The case agent consumes journey types/component after task 3 lands. Existing files named here were inspected on main fd15157; new paths are proposed. Do not rewrite the whole case controller or global styles.

### Task 1: Backend guidance and grouped status filtering

**Produces:**
- In contracts, SubmitterView = "all" | "needs_attention" | "awaiting_review" | "approved".
- SubmissionGuidance = { kind: "reviewer_feedback" | "missing_information" | "awaiting_review" | "approved_copy"; revision: number; text: string; recordedAt: string }.
- DashboardRow extends CaseSummary with guidance: SubmissionGuidance | null.
- DashboardResponse.rows becomes DashboardRow[]; add submitterAttention: DashboardRow[] | null. CaseSummary and CaseDetail remain unchanged.
- dashboardQuerySchema adds view with default all. Reviewer non-all view and non-all view + non-all status are 400s.
- Store.dashboard(workspace: string, query: DashboardQuery): Promise<DashboardResponse> keeps its signature.

- [x] Add dashboard API tests first: needs_attention returns exactly changes_requested + needs_information; awaiting_review only ready_for_review; approved only approved. Count/page forward/backwards across at least 12 interleaved statuses, same target-date ties, literal search, product and direction.
- [x] Add revision-bound guidance tests: v1 changes request then v2 resubmission has no v1 current feedback; automated missing context is labeled separately; current approved event identifies its revision; deleted/foreign-workspace cases do not appear.
- [x] Run the focused dashboard tests and confirm the added expectations fail.
- [x] Implement group predicates in the existing SQL before pagination/counts. Keep reviewer behavior and scope=page lean.
- [x] Implement one bulk guidance query for the union of at most ten page IDs plus three attention IDs under default limit; honor the API's existing limit cap for explicit callers. No per-row fetches. Truncate guidance at 240 Unicode characters. Use current revision events/checks/timestamp according to the spec; never use latest unrelated case activity as submitted time.
- [x] Enrich submitter rows, set reviewer row guidance null, and return attention only on submitter scope=full. One unknown-check explanation or current human event supplies the snippet; unavailable source returns null and UI uses the neutral fallback.
- [x] Run: DENO_NO_PACKAGE_JSON=1 deno test --allow-env --allow-read --allow-write=.data --allow-net --allow-sys apps/api/test/dashboard_api_test.ts. Expected: all pass. Run npm run check once integrated.
- [x] Commit this independently reviewable API slice.

**Limit:** do not change decision mutations, seed history or schema. Missing approval evidence is never invented from a generic ready status.

### Task 2: Route composition, role state and navigation

**Consumes:** SubmitterView, DashboardRow, DashboardResponse.
**Produces:**
- DashboardFilters gains view: SubmitterView, default all.
- dashboardRequest includes view, resets incompatible status/view combinations through UI transitions, keeps server sort/direction, and keys role-dependent guidance correctly.
- SubmitterDashboard renders the two top panels only, with this frozen interface: `{ attention: DashboardRow[]; attentionTotal: number; selectedId: string | null; refreshGeneration: number; loading: boolean; error: string | null; onSelect(id: string): void; onViewAttention(): void; onRetry(): void }`. It does not own the queue, filters or mutation dialogs.
- ReviewQueue owns the bottom table, active tabs/callbacks, count display, next-step column, filter/paging state, selection, refreshGeneration and action dialogs. onViewAttention sets view=needs_attention, status=all, resets paging and focuses the queue. onRetry reloads the dashboard. UI agent only owns the top-panel presentation and selected-detail loader; no competing table controller.
- DashboardShell receives role: DemoRole from Workspace, avoiding a new circular context import.

- [x] Extend scripts/dashboard_test.ts for view serialization, neutral legacy-filter restoration, independent per-role filter persistence, and queue cursor reset on role/view/search/product/direction change. Counts stay cohort-wide, never page-derived.
- [x] Run the focused test file to see new expectations fail; implement request/state changes and retain scope=page overview/attention for matching role/search/product only.
- [x] Split ReviewQueue rendering into reviewer vs submitter compositions without duplicating mutation controllers or action dialogs. Keep reviewer markup/map behavior intact; pass submitter presentation props from the same resource.
- [x] Use session-storage keys per role. Discard old ambiguous saved filters rather than carrying approved-only or pagination state between roles. Close stale action state on role change; preserve existing expectedRevision behavior.
- [x] Update role-specific headings/sidebar/back links. Reviewer New submission becomes secondary; Open next review uses the first existing actionable item, with no fabricated assignment/claim action. If empty, omit that CTA.
- [x] Implement the submitter All / Needs attention / Awaiting review / Copy approved tabs and next-step column in the existing table, using task 1 guidance and cohort totals. Style these variants in review-dashboard.module.css.
- [x] Keep full-row links and ellipsis actions. Add submitter Preview journey menu action separately, preventing row navigation only for that explicit button. Existing destructive/decision dialogs remain intact.
- [x] Run focused dashboard tests and npm run check; browser-smoke role changes, second page, filter resets and mobile menu.
- [x] Commit after backend contract integration.

### Task 3: Submitter home and truthful journey

**Files:** new components/submissions/submitter-dashboard.tsx, submission-journey.tsx, submissions.module.css; new lib/submission-journey.ts; new scripts/submission_journey_test.ts. Paths under apps/web/src unless specified.

**Produces:**
- JourneyEvent = Pick<Activity, "id" | "type" | "revision" | "createdAt" | "message"> for submitted/revised/changes_requested/approved only.
- buildSubmissionJourney(detail: CaseDetail): { events: JourneyEvent[]; currentRevision: number; openManualConcerns: ManualFinding[] }.
- SubmissionJourney({ detail, selectedRevision? }: { detail: CaseDetail; selectedRevision?: number }) renders links to exact revision snapshots. Loading/fetch wrapper lives in submitter-dashboard.tsx and uses the existing useResource for only the selected case, mounted with React key equal to selected ID + mutation refresh generation. Changing only the useResource URL is insufficient because it retains already-loaded data.

- [x] Write pure history tests: one revision stays one observed submission event; v1 request/v2 resubmit retains exact links; v1 approval followed by v2 does not mark v2 approved; manual concerns persist; equal timestamps retain stable source order. Do not make duration-based geometry.
- [x] Run new tests directly with Deno and verify expected failures, then implement helper and component.
- [x] Build Needs attention list with explicit source labels and separate Preview/Revise controls, plus selected current-state panel and ordinal node line. Preserve all actual events; initially show last four revision groups with an accessible Show earlier history control.
- [x] Wire View all to onViewAttention and Preview to onSelect; task 2 owns tabs, table rows and next-step column. Display attentionTotal from the server cohort, not attention.length.
- [x] Lazy-load only selected CaseDetail. Remount the loader on selected ID + refreshGeneration changes, and render data only when detail.case.id equals selectedId. Add an A-to-B browser check with B deliberately delayed: A feedback must disappear immediately while B shows a local skeleton. Cancellation alone does not remove already-loaded A data. On mutation refresh both dashboard and selected detail; on 404 clear stale detail and offer list refresh. Selection filtered out of cohort resets to spec default.
- [x] Cover errors/loading/empty/one/many states. At 390px use the vertical journey with visible labels, keyboard/tap selection, no hover-only information and reduced-motion support.
- [x] Run DENO_NO_PACKAGE_JSON=1 deno test --allow-read scripts/submission_journey_test.ts, npm run check, then visual inspection at desktop and 390px.
- [x] Commit UI slice after contract/controller review; do not ship fabricated timeline fixtures.

### Task 4: Submitter case experience

**Files:** apps/web/src/components/case-review.tsx, apps/web/src/components/case-review.module.css, new apps/web/src/components/submissions/submission-feedback.tsx.
**Consumes:** CaseDetail and existing mutation/editor components; optional shared SubmissionJourney from task 3.
**Produces:** SubmissionFeedback({ detail, revisionNumber }: { detail: CaseDetail; revisionNumber: number }) displaying source- and revision-bound feedback without mutation controls.

- [x] Add a focused API workflow test (new apps/api/test/role_workflow_test.ts): submit → request changes with a manual concern → revise → confirm concern remains open and approval still blocked → reviewer resolves concern → approve exact v2. Also test new revision after approval returns to the actual analysis-derived status.
- [x] Keep mutation logic unchanged; arrange submitter feedback/context/editor before coverage, with older feedback explicitly labeled and manual concerns read-only. Current open concerns must not appear to be a historical snapshot.
- [x] Keep reviewer evidence and decision layout intact. No submitter confirm/dismiss/resolve controls; direct unauthorized mutation requests must still fail.
- [x] Keep feedback visible during editor use; use existing ?intent=revise. Historical revisions remain read-only; approval names the exact revision and its limited scope.
- [x] Put existing AI opinions in an accessible collapsed panel for both roles without auto-generation or moving them ahead of human feedback.
- [x] Run the focused workflow test and npm run check. Browser-walk the loop using an isolated local fixture, including stale expectedRevision and role change while editing/confirming.
- [x] Commit the case slice separately.

### Task 5: Integrate, review and stop

- [x] Add the new pure journey test file to the root Deno test task. No new test framework or broad component-snapshot suite.
- [x] Run npm test, npm run check, npm run build against combined main once. Add/repair only meaningful regressions; no repeated broad checks after unchanged code.
- [x] Verify reviewer map/queue and submitter home at desktop and 390px; check keyboard, long labels, empty/no-attention, multi-page mixed statuses, isolated detail errors, deleted selection and rapid role changes. Confirm detail/AI requests are bounded using browser network/dev evidence.
- [x] Ask fresh Claude reviewer to inspect fictional demo screenshots and the completed workflow against the spec. Independently review contracts, SQL filtering and mutation gates in-repo. Address actionable findings in the owning slice.
- [x] Update shared handoff and README demo flow. Integrator alone commits/pushes reviewed main; do not stage .claude/launch.json or unrelated work.
- [ ] If delivery includes the hosted app, explicitly deploy API/frontend in compatible order and verify both. A main push does not deploy this project's source-upload Vercel setup. Report source and deployment separately.

## Parallel work and release order

First freeze task 1's small contract with the integrator. Then run backend task 1, UI task 3, and case task 4 in parallel with their file ownership above. UI uses typed test fixtures, not a competing API. Integrator owns task 2 and all shared-file edits. Task 4 can land feedback improvements before task 3, adding shared journey only after it exists.

Merge in small working slices: API → home/controller + submitter presentation → case experience → verification/docs. Reviewer path must work at every stage. No draft-PR parking, broad refactor, ownership project or “one more chart” after acceptance.

Builder check completed: explicit keyed remount plus case-ID guard prevents stale selected detail; the frozen top-panel props separate UI work from the integrator-owned table/filter/controller. No important product questions remain.


## Implementation record

- Backend/API: 8ba540c. Coverage uses the dedicated submission_guidance_test.ts file to avoid collisions with concurrent workspace work. Tests exercise interleaved grouped views, ties, literal filters, both directions, Unicode limits and absent-source fallback.
- Dashboard/journey: 001aefb. Selection persists across table filters/pages; selected details remount by identity and mutation generation. Shared controls and real row links remain.
- Case experience: 784ad34. Missing-information guidance stays visible while editing; historical human feedback remains revision-bound.
- Separate user-authorized Claude work was reconciled first in 73b7665: the demo now shares a single workspace between visitors. Store-level workspace scoping remains; visitor cookie isolation was intentionally removed by that separate request.
- Combined verification: 173 tests passed, frontend/backend type checks passed, production build passed. Browser checks covered reviewer/submitter switching, grouped pagination, a no-attention cohort with an empty table tab, preview focus, exact revision links, and the editor's automated missing-information context.
- 390px browser checks found no horizontal page overflow and preserved a vertical event diagram. A deliberately delayed network fixture was not injected into the user's running app; stale identity protection was independently reviewed and normal rapid selections verified.
- Fresh GPT spec/quality review found four issues; scoped re-review confirmed all resolved. Claude screenshot review informed compactness, status consistency and source labels. Existing row-click behavior was retained instead of changing row clicks into selection. Historical stored feedback text was not rewritten for aesthetics.
- No new auth, ownership model, earnings data, activation semantics, dependency or database migration.
