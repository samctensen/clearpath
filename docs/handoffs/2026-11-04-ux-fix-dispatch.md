# UX fixes — delegated implementation

User authorized assignment after the comprehensive UI/UX review. Starting point: canonical `/Users/sam/Developer/clearpath/clearpath-frontend`, main `f90ba8d`, synchronized with origin. Preserve the subsequent focus and jump-highlight refinements. Read `current-state.md`, the comprehensive review, and relevant AGENTS.md instructions. Use CodeGraph for structural exploration.

## Product target

Make accurate review and the correction loop easier. Preserve the dark neutral/deep-purple design, graphical review map, icon-only account menu, role-specific wording, bounded checks, exact-revision gates, shared-demo semantics, and immutable history. Do not introduce auth, revenue analytics, speculative infrastructure, or a new aesthetic direction.

## Ownership and order

All workers edit the canonical checkout on main. No worker commits, pushes, resets, switches branches, touches `.claude`, deploys, or resets/mutates the running demo. Root owns integration, staged commits, shared configuration, browser verification, and deployment decisions. Test isolated fixtures, not existing shared cases. Coordinate additional files before editing. Do not run simultaneous Next builds or stop ports 3000/8000.

### Agent: ux_data_integrity

1. Correct generated approved fixtures. Ordinary approved copy must agree with recorded offer/context; do not automatically dismiss real mismatches with a generic reason. Add focused isolated fixture tests, and one deliberate request→revision→approval sample if the seed API supports it cleanly. No rewrite of existing persisted events or automatic reset.
2. Then make change-request feedback structured and human-readable: preserve legacy event messages, supply readable rule titles/quotes/next steps, and render specific requested corrections in existing feedback surfaces, including the revision editor. Announce any contract shape before implementing; coordinate with case owner.
3. Own `apps/api/src/seed.ts`, dedicated seed tests, `packages/contracts`, `packages/models`, associated focused API/model tests, and `components/submissions/submission-feedback.tsx` plus its own new presentation module if needed. Do not edit case-review, submission-form, review-queue, or shared CSS without coordination.

Acceptance: all approved fixtures have defensible decisions; a new change request presents each correction once, with no raw rule IDs; old audit history stays intact; saved-revision feedback remains distinct from unsaved draft checks.

### Agent: ux_draft_safety

1. Protect unfinished new/revision input against Cancel, role switching and navigation; retain recoverable drafts scoped to the submission/revision, not authoritative product records. Use styled confirmations, not new native dialogs except unavoidable browser unload prompts. Untouched Cancel stays immediate.
2. Preserve draft text after stale-revision conflicts and offer explicit latest-revision recovery without silently rebasing.
3. Require an explicit Complete asset/Excerpt only choice on new submissions. Preserve saved choices on revisions and allow deliberate Unknown metadata, explaining Needs information. Correct the submitter's New submission back label.
4. Own `submission-form.tsx`, `workspace.tsx`, new draft/guard helpers and focused tests, and new dedicated CSS only. Coordinate the smallest case-review prop changes with the case owner; do not edit that file concurrently.

Acceptance: dirty edits cannot silently disappear; conflict recovery retains text; unchanged cancellations do not prompt; no automatic submission; completeness is explicitly selected on new records; guards/dialogs work with keyboard and mobile.

### Agent: ux_case_flow

1. Replace full-copy-only comparison with readable text changes, changed metadata, and changed evidence under the same rule. Keep full copy available, whole-copy rechecks, historical revision identity, and a bounded diff algorithm.
2. Use consistent revision-specific confirmation for case approval; preserve expectedRevision/approval gates. Explain valid concern→request changes, incorrect finding→reasoned dismissal, missing information→specific request.
3. Own `case-review.tsx`, `review-actions.tsx`, new comparison component/helpers/tests and dedicated CSS. Existing `case-workspace.module.css` only if needed; preserve current focus/rail behavior. Root coordinates queue context and data-feedback integration. Honor requests from draft agent for narrow prop integration.

Acceptance: 18→12 and format-only changes are obvious; same-rule changed evidence is visible; case and queue approvals both confirm the exact revision/scope; historical dispositions never become current clearance.

### Follow-up unit: queue continuity — assigned to ux_case_flow

Preserve page/cursor, filters, order and scroll return context across queue→case→queue; handle an empty final page. Add explicit Return to queue/Next review after decision with case-owner coordination. Make overdue dates readable. Own review-queue and new queue/navigation helpers. Keep this separate from the comparison unit.

Mobile density is assigned to ux_draft_safety as a separate follow-up unit after draft protection: reduce automatic/repeated single-event journey content without removing the chart or existing Needs attention. Own submitter-dashboard/submission-journey files for that unit. Coordinate changed feedback presentation with ux_data_integrity.

Acceptance: page-two round trip returns to the same cohort/location; no loading scroll regression; next review is deliberate; mobile reaches the list sooner without hiding current feedback.

## Review and integration

Workers report each small completed unit with changed files, behavior, focused verification, and remaining risks. Root reviews source and isolated tests, then runs required combined checks/build once appropriate. Use a real Claude review for the integrated screens/diffs where tool approvals permit; do not represent GPT reviews as Claude. Fix verified findings promptly. Integrate coherent small commits on main, never broad snapshots from old worktrees. Source merge and hosted deployment are separate milestones.
