# Submitter homepage: review and proposed direction

2026-11-04 · Design proposal, not implemented in the app.

## Outcome to serve

ClearPath's supplied assignment is to increase compliance marketing review throughput. Product intuition and accuracy are the stated evaluation criteria. Our thesis is less reading, reference lookup, and back-and-forth on exact marketing-copy revisions. The submitter's contribution is to provide complete context, understand requested corrections, and return usable copy. Any throughput benefit remains a hypothesis until observed; no earnings, approval ETA, publication readiness, or measured time-savings data exists.

## What the current hero gets wrong

The attention list, selected-case preview and table repeat the same records, feedback and next actions. The preview makes users select a submission and then open it elsewhere to do useful work. A one-event timeline spends substantial area on information already expressed by revision/status. Large prose blocks make comparisons hard, and the unrelated card heights weaken hierarchy. Three featured cases out of18 are selected by target-date order, which the surface does not explain. Historical reviewer snippets expose repeated sentences and rule IDs. Those messages are historical records: preserve the originals; use newer structured feedback when available and a bounded readable excerpt otherwise.

The supplied inspiration earns its density through relationships, visual comparison and direct manipulation. Borrow those mechanics and restrained surface treatment, not retention metrics or a continuous time axis unsupported by the demo.

## Recommendation: replace both hero panels with a reason chart

Working UI title: **What needs input**.

A compact full-width ranked horizontal chart shows why current submissions need attention. The existing table is the only work list. Selecting a reason filters that table; there is no extra case preview or miniature list. Full history stays in the individual submission page. Remove the homepage Preview journey affordances if the preview is removed; keep access to case history through normal row navigation.

- Bar length = number of distinct submissions in that reason. Direct count labels; one shared scale.
- Source is explicit: Missing information (amber), Reviewer request (blue). Purple is selection/action identity, not a new workflow status.
- Draw a restrained selected-state treatment and animate changes after a user action. No ambient particles, countdowns or celebratory approval implications. Texture can distinguish sources in addition to labels.
- Header count = unique attention submissions in the search/product cohort, not sum of bars. A submission can belong to multiple reasons; label that once.
- Show the most common four reasons initially, with an explicit expansion when more exist. Sort descending count with a stable tie order. Frequency is not severity or priority.
- Selecting a bar pins it, displays a concise explanation, and adds a removable reason chip to the table. Hover/focus previews are supplementary; tap and keyboard do the same selection.
- Existing row actions take users to Add information or Revise copy, with recorded feedback in the existing editor. No automatic bulk correction or approval.
- After a successful revision, refresh actual status and memberships. A submission leaves a reason only when the authoritative current state supports that. Requests for an earlier revision are not current work after resubmission.
- On mobile retain the same horizontally ranked chart with labels above shorter bars if needed. Stack no extra preview panel. Keep44px hit areas and the table's existing responsive behavior.

## Truthful data boundary

This needs a server aggregate and a matching server filter. The current lightweight list does not contain enough information to calculate the chart client-side. Do not fetch full case histories for every row.

Eligible cases: non-deleted current cases in needs_information or changes_requested, scoped to the same workspace/search/product cohort as the existing table.

1. Needs information: use current revision unknown checks, grouped by recorded rule ID and source=missing information. Count a case at most once per reason. These are automated context gaps, not reviewer requests.
2. Changes requested: use the current revision's actual structured change-request items. Source=check is grouped by sourceId with a user-facing rule label. Manual items and free-text-only requests belong in Other reviewer feedback. Do not promote unconfirmed automated findings to reviewer requests.
3. Legacy prose-only requests: Other reviewer feedback. Do not infer classification by parsing raw slugs/prose or by substituting present-day checks for historical reviewer intent. No destructive seed reset/backfill to beautify the chart.
4. If structured feedback has a freeform note in addition to typed items, count that case in Other reviewer feedback as well; multiple reasons are permitted. Duplicate same-rule items count once.
5. If a status claims attention but its expected source is absent/inconsistent, expose a neutral Details unavailable group with an Open submission action; never silently drop the case from the aggregate.
6. Open manual concerns on awaiting-review or approved cases do not automatically become submitter tasks. Copy approval remains exact-revision human approval and is never publication clearance.

The existing sample workspace may therefore have a large Other reviewer feedback category. This is a real limitation, not something design should hide. The concept uses clearly labelled illustrative data to show the richer state once new structured requests exist.

Selecting a reason explicitly selects Needs attention and resets queue pagination, retaining search/product filters. Selecting All/Awaiting review/Copy approved clears the incompatible reason chip. Clearing the reason alone stays in Needs attention. Chart counts remain cohort-wide and independent of page/sort. One server predicate must power both chart membership and filtered table counts/results. Preserve scroll position during query updates and retain filters when returning from a case.

## Alternatives considered

**Selected-case check strip:** Claude's preferred smallest change. Use the six recorded check outcomes for the selected case, a separate reviewer-request lane and a precise next action. Reuses the one detail fetch. It makes the current preview more useful, but preserves the top-level case-selection surface above the table and repeats information available on the case page. Avoid interpreting passed/not-applicable as clearance or relabelling all findings as offer mismatches.

**New-copy preflight workbench:** strongest prevention story. Bring selected offer and editable copy together with exact highlighted mismatches before submission. It could make the first visit engaging. However, the existing new-submission flow already does self-checks; a second form risks draft/context inconsistency and distracts returning users from requested edits. Keep a prominent entry into the existing flow first. The second interactive concept illustrates the reward loop, not a new implemented checker or a safe automatic correction feature.

**Target-date runway:** honest requested-date marks can reveal urgency, but dates are neither approval promises nor actual launches. Many existing seed targets are past; a schedule would be dominated by demo dates and would not explain what to fix. Keep dates and sorting in the table for this pass.

## Independent review

A fresh Codex product reviewer recommended the reason chart because it provides information across submissions that the table does not convey. Claude independently reviewed the two supplied screenshots and the user-approved short assignment/data summary; it recommended a selected-case check strip because current data is readily available and warned against invented legacy classifications. We retain the chart recommendation with a strict Other reviewer feedback fallback and an explicit aggregate/API cost. This is a product judgment, not unanimous reviewer consensus or a usability study.

## Small implementation slices if this direction is chosen

1. Contracts/API: reason identities, authoritative counts, membership filter, schema validation, current-revision and legacy fallback cases. Keep list payload lean and independent of pagination.
2. Submitter UI: replace both current hero panels with the chart; remove abandoned preview state/actions; preserve reviewer dashboard. Card-level skeleton/error/empty states and reduced motion.
3. Interaction: link chart to existing backend filtering, visible chip/reset, status-tab compatibility, URL/back continuity, mutation refresh without scroll jumps.
4. Verify: overlapping reasons do not inflate unique count; dismissed/older findings do not appear as current requests; legacy feedback stays unclassified; empty/search/product/pagination states agree; desktop/mobile keyboard/touch interaction works. Observe whether a user can identify a repeated correction and open a matching submission without scanning feedback paragraphs.

## Review artifacts and status

The interactive companion compares Fix patterns and Copy preflight with illustrative data; it does not call the API or modify submissions. Live application code, database, main branch and deployment were unchanged during this design review.
