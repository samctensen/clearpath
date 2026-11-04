# ClearPath shared state — 2026-11-04

## Canonical checkout

Use `/Users/sam/Developer/clearpath/clearpath-frontend` on `main`. This is the checkout serving localhost:3000 and the local API on 8000. Fetch and inspect main before starting work. The old `clearpath-role-actions` worktree and `codex/homepage-dashboard` branch are historical; do not run the app from them or restore their old snapshots over main.

Sam wants small reviewed changes merged and pushed promptly, with no draft PR backlog. Coordinate file ownership across agents and leave one integration owner for Git and deployment. Do not reset, stash, switch branches, or overwrite shared files while another agent is editing. Keep the local development checkout current after merging.

## Work reconciled into main

- PR #2 (`5cbb3ee`): dark workspace, custom controls/loading, clickable queue rows, mobile navigation and branch chart, server filtering/sorting.
- PR #3 (`609b56c`): role-aware menus and fresh-revision confirmation dialogs; reviewer approve/request changes; submitter revise/delete; soft deletion retains history and prevents reseeding.
- Claude contribution (`990c20b`): keyset pagination, lean page queries, expanded 18-campaign fictional seed, decision log and policy guide integration, case-page refinements, status-color updates and tests.
- Reference-page navigation (`f6fc79e`): Decision log and Policy guide links and active states.
- Integration completion: Claude's paging migration renamed to `004_queue_paging.sql`, preserving the deployed `003_soft_delete_cases.sql`; archived decision records stop linking to inaccessible cases; malformed timestamp cursors return validation errors.

The old pagination commit `f899e2e` was integrated by content into `990c20b`; it is not missing because it is not an ancestor. Do not cherry-pick it again. The old role-actions commits are ancestors of main.

## Claude handoffs checked

Local Claude sessions: `09d10736-ebe4-4595-9da1-fa4b5b05819d` (seed/integration), `bb432949-bc1d-4668-a8b8-ca72e4d9da9c` (status colors), `3990e1b0-d060-4391-85ac-33c585ca0996` (migration numbering). Final status tokens are amber `#ffc100`, blue `#1fa2ff`, green `#19e67f`, with deep purple actions. Notices and badges derive from tokens. Copy highlighters stay unchanged per Sam.

The PR merge chat and reference-pages chat reported no remaining implementation or active editing jobs. Role-action agents were notified that main is canonical. The `.claude/launch.json` file is local preview configuration, intentionally not application source and not committed; it runs `npm run dev:web` on port 3000.

## Validation and deployment boundary

Final combined verification: 160 tests passed, frontend/backend type checks passed, and the production build passed with dashboard, case review, offer library, decision log, submission and policy guide routes. Prior main commits also passed GitHub CI. This sync adds focused tests for archived decisions and malformed cursors.

The last deployment verified by this chat was frontend source `20569dd` (`dpl_chtUePPf7gR5299nxDBKgBqeXAfx`) and backend `q8z8chqyqctg`. Newer main changes are not automatically deployed because the Vercel project uses source uploads. Do not confuse Git main synchronization with hosted deployment. Production mutation smoke was denied by automatic review; use isolated local fixtures for writes and read-only production checks.

Deletion removes active access but retains audit records. Demo roles are a simulation, not account authentication. Preserve revision checks, approval gates, workspace isolation and truthful UI counts. The take-home remains focused on product intuition and accurate human review, not extra infrastructure or invented analytics.

## Role workspace planning — 2026-11-04

Sam requested exploration and a plan, then delegated the product choice. The reviewed recommendation is in [role workspace design](../superpowers/specs/2026-11-04-role-workspaces-design.md) and [implementation plan](../superpowers/plans/2026-11-04-role-workspaces.md). This is planning only: no role redesign has been implemented or deployed by this work.

Preserve the reviewer map; give submitters Needs attention, an actual revision journey and a feedback-first case page. Keep workspace-wide demo semantics; no earnings, activation, ownership/auth migration or invented historical performance. Two independent Claude reviews and a fresh GPT builder check informed the plan. The plan defines three parallel lanes with an integration owner and explicit file boundaries.

The planning inspection used main `fd15157`, which includes the concurrent change to 50 seeded cases (superseding the earlier 18-case seed note above). Existing workspaces may differ. Do not assume sample history has multiple revisions; the journey must be useful at revision 1.

## Role workspaces implemented — 2026-11-04

Sam approved implementation. Small integrated commits: 73b7665 (Claude shared workspace), 8ba540c (role guidance/grouped API views), 001aefb (submitter dashboard/journey), 784ad34 (feedback-first case view). Source is on canonical main. Submitter home is now Submissions with Needs attention, one lazy-loaded actual revision journey and Workspace submissions tabs; reviewer retains its map/queue. Manual concerns stay reviewer-controlled; historical decisions/feedback are revision-bound. AI remains available to both roles, collapsed and advisory.

The separate Claude user request to remove cookies was completed concurrently and is now integrated: visitors share one demo workspace and submission links work between visitors. This supersedes earlier references to per-browser workspace isolation. Store-level workspace scoping remains. README documents the shared reset endpoint; do not call it during production verification.

Validation: 173 tests passed; type checks and production build passed. Independent GPT code review's four findings were fixed and re-reviewed; real Claude screenshot review informed visual refinements. Desktop/390px browser checks passed for selection/filter/paging/role and missing-information editor behavior. Hosted deployments were not changed in this implementation pass. The remaining untracked .claude/ directory is local-only configuration.

## Role design audit and scroll fixes — 2026-11-04

Claude Opus reviewed the new role designs and reference pages, then re-reviewed corrections and actionable reviewer controls. Findings/dispositions and verification are in `docs/reviews/2026-11-04-role-design-and-scroll-review.md`. Two subagents implemented the loading geometry and design corrections; cross-review caught and fixed the expanded-self-check footer gap.

Dashboard requests reserve settled element heights while loading and disable automatic scroll anchoring within the dashboard. Results never remain stale/actionable under new filters. Slow-response production-mode browser check: desktop paging held y=453 throughout; final mobile empty-filter Reset held y=511 before/after all panels settled (510.5 during subpixel layout), even as document height grew from 1355 to 3986. Single-result search holds 1628px document height during pending. Genuine shorter final results may clamp naturally. Explicit Preview journey/View queue navigation still scrolls intentionally.

Empty feedback is compact, actions/status colors consistent, missing-information evidence clearly labelled. Form draft checks distinguish unsaved results; passed/not-applicable details collapse, concerns stay visible, and self-check precedes final submission controls on mobile. All four collapsed checks were expanded successfully in browser; mobile width stayed 390px with no horizontal overflow.

173 tests, type checks and production build passed. No production deployment or demo-data mutation/reset was performed; deterministic Run checks used the existing local app. Temporary read-only delayed proxy and production test servers are task-owned and stopped after verification. Main remains canonical; `.claude/` remains local-only.

## Comprehensive UX fixes integrated — 2026-11-04

See `docs/reviews/2026-11-04-ux-implementation-verification.md` for commit boundaries, evidence and limitations. Main includes corrected approved seeds, immutable structured feedback (additive migration 005), protected unsent drafts/explicit conflict recovery and completeness, readable revision diffs, consistent approval confirmation, queue return continuity/Next review, and compact mobile single-event journeys. Three agents completed their lanes; root cross-reviewed and integrated them. Preserve subsequent focus/rail refinements from f90ba8d.

212 tests, frontend/backend type checks and production build passed. Browser checks used disposable data: exact 18→12 comparison; revision2 approval; stale revision1 save recovered explicitly into revision3; queue page2 returned to identical row/scroll position. Real Claude review informed final small copy/layout refinements, followed by another clean type/build check. Old shared demo records were not rewritten or reset; structured feedback applies to new requests. No hosted deployment occurred; migration005 must accompany the backend release. Do not claim existing hosted samples were cleaned. Optional overdue/historical-disposition polish and a preloaded multi-revision seed remain outside this completed main fix pass.


## Submitter Fix patterns — 2026-11-04

Sam approved replacing the duplicate Needs attention/journey homepage panels with the Fix patterns concept and asked for more visually interesting bars. Backend commit caa1149 adds current-revision reason memberships and server filtering; frontend commit 3fb862f adds the compact What needs input chart. Amber hatch and blue dot textures distinguish missing information from recorded reviewer requests, with a deep-purple selected row and bright terminal cap. The queue is the sole detail list; case histories remain.

Reason counts and table filtering share one SQL membership definition. Counts are distinct cases per reason, while the total is their distinct union; a case may have multiple reasons. Latest current-revision structured requests are used; legacy/manual/freeform feedback stays Other reviewer feedback, and missing/inconsistent sources stay Details unavailable. No prose classification, invented analytics or implied approval. Search/product scope both chart and queue; pagination and sorting retain the valid summary; mutations invalidate it. Row guidance is hydrated only for the requested page.

Three modular implementation lanes and independent review completed. One malformed-check fallback issue was fixed and re-reviewed. Final verification: 222 tests passed, frontend/backend type checks and production build passed. Local browser covered selection, paging, same-page case return, selected zero-results after product filtering, mobile (390px without horizontal overflow), keyboard activation, clearing and role switch. No shared demo data was mutated/reset. Temporary viewport and original Reviewer role were restored.

Design and implementation notes: docs/superpowers/specs/2026-11-04-fix-patterns-design.md and docs/superpowers/plans/2026-11-04-fix-patterns.md. No hosted deployment was performed; main synchronization is not deployment. The previous migration005 deployment requirement still applies. Local .claude/ stays untracked.
