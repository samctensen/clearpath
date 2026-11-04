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
