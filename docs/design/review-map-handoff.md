# Review map: reference-led replacement for launch horizon

User approved neutral dark/deep purple palette but rejected chart clarity and visual strength. Explicit references:
- Yuri: https://x.com/yurygok/status/2115706303645356136 (direct annotations, visible discrepancy, same series mapped to exact table)
- Maxim: https://x.com/disarto_max/status/2114034481392693304 (cost composition and model routing)
- Maxim: https://x.com/disarto_max/status/2117664457862033627/video/1 (model router, branched paths linked to exact destinations/table)
Local references are in docs/design/references/expanded, named with those post IDs. Root viewed router video and static references; GPT inspected eight posters. Static posters alone do not establish motion.

## Decision
Replace the sparse date plot with a current-status review map. All six cases share one target date; existing reliable differences are current workflow status, product, copy findings and unknowns. No history/traffic/rate is implied. One origin showing the cohort total branches into four direct status labels/counts. One selectable token per submission on the horizontal end of each branch. Thin equal-width curves communicate grouping, not volume. This borrows the reference's correspondence between object, annotation and record. Keep existing queue and role-aware Up next; the map itself should be substantially shorter (about 380–420px total).

Colors and shell remain current v4. No new libraries or backend calls. No pie chart, fake trend, fabricated traffic metrics, or arbitrary index numbers. The user subsequently requested subtle decorative particles on the selected branch; their final motion direction is recorded below. Avoid product abbreviations that make users decode a legend.

## Interaction
- Status destination is an actual button, aria-pressed; calls onSelect(status). Parent toggles that queue filter as today. Chart cohort remains search/product only.
- Each token is an actual HTML button with accessible full campaign/status name; hover/focus previews a record in the inspector below the graph; click/Enter/Space also moves focus to its Open review link. Inspector explicitly shows full title, product, current status, revision, target date, separate findings and unknowns, and a real Open review Link.
- Selection emphasizes one token/branch, never changes an underlying record. Status selection defaults inspector to a matching visible record. All-status default picks role-appropriate work (via parent optional preferredCaseId) or first available record.
- Each branch shows max 8 tokens; if more, a clearly labelled +N control filters that status and all records remain in queue. Explain `Each dot is a submission` and total plotted vs cohort if capped. No fake dots in empty status. Zero-count labels stay legible and interactive to show empty queue.
- Diagram has no clock axis. Earliest launch date can stay as small metadata in record inspector; no redundant headline countdown.
- No overlay tooltips needed: stable inspector is keyboard/touch accessible. Use restrained 150–200ms transitions for deliberate selection, respect reduced motion.
- Diagram must fit 390px phone without page overflow. It can switch to four compact status rows with token groups on mobile if the curved layout cannot preserve usable touch targets. Desktop path connector and object selection are the memorable motif.

## Files / ownership
GPT model worker: apps/web/src/lib/review-map.ts and scripts/review_map_test.ts only.
Claude visual worker: apps/web/src/components/dashboard/review-map.tsx and review-map.module.css only.
Root: ReviewQueue integration, tests registration, docs, review, deploy.

Model contract (agreed):
`buildReviewMap(cases: readonly CaseSummary[], preferredCaseId?: string)` returns `{total, open, followUp, plotted, groups, initialCaseId}`.
Each group: `{status: CaseStatus, label: string, items: CaseSummary[], visible: CaseSummary[], hiddenCount: number, count: number}`.
Order ready_for_review, needs_information, changes_requested, approved; labels from statusLabels. max 8 visible each. Stable target-date order: valid YYYY-MM-DD first ascending, then createdAt, then id. Invalid dates last. `followUp = needs_information + changes_requested`; `open=total-approved`. InitialCaseId uses preferred if present, otherwise first open in group order, otherwise first approved, null if empty. No mutation. Groups always present, even empty.

Component public props: `{cases: CaseSummary[], selected: CaseStatus | "all", onSelect: (status: CaseStatus) => void, preferredCaseId?: string}`. Export `ReviewMap`. Use `buildReviewMap` and contracts productLabels/statusLabels. CSS custom properties from parent shell --dash-bg/panel/raised/border/text/muted/accent/accent-fill/ready/info/waiting/approved. DashboardIcon available with local FontAwesome names from existing public/icons/dashboard.

## Final visual refinements
- A single SVG path spans each curve and straight rail. Monotonic controls and a wider bend remove the seam between the former SVG curve and CSS line. Markers are distributed across the straight portion and remain actual submissions.
- The entire branch has a 24px pointer hit area. Hover highlights its path and status label; clicking filters that status, as does the accessible destination button. Selected borders and keyboard outlines use the relevant status color.
- Vivid status tokens: ready #a16bff, information #ffc53d, changes #3bafff, approved #35e39c. Neutral surfaces and the deep purple primary action remain unchanged.
- Two distinct motion layers: the original 900ms sweep confirms a selection; two tiny, faint trails travel slowly along the selected branch and around its destination border on a 14-second loop. The trails are decorative selection emphasis, not submissions or live throughput. No animation appears for empty statuses. Reduced-motion removes both layers.
- The desktop orbit uses a ResizeObserver only to measure the network width. Its single path follows the branch and the actual destination perimeter. At container widths at or below 700px, the map becomes stacked status groups with one subtle perimeter trail; the mobile perimeter uses its actual viewport so rounded corners stay aligned.
- Titles and metadata wrap; desktop metadata spans the inspector width. Activating a token reveals and focuses the matching review link, avoiding accidental selection changes while tabbing through other markers.
