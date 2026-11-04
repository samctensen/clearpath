# ClearPath workspace refinement

## Intent and authorization
Sam requested implementation while asleep: refine dashboard loading, custom dropdowns, status pills and header; redesign remaining pages in the accepted neutral-black/deep-purple system, using Claude design review. Proceed with reasonable design decisions without another approval loop. The handoff's known evaluator criteria are product intuition and accuracy; throughput is the product goal, not a proven metric. No additional hidden rubric is assumed.

## Design decisions
- Preserve the accepted dashboard review map and its selection/ambient motion. Replace the full-workspace loader with card-contained loading: graph-specific skeleton/trace, Up next placeholders, pulsing table rows. Keep headings and controls available; no invented zeros while loading.
- Use a reusable custom listbox for product, status, offer, asset/context and revision selectors. Dark neutral surfaces, 12–14px chevron inset, accurate selected labels, viewport-aware popup. Outer ring only while expanded; closed keyboard focus retains a subtle border treatment. Support arrows, Home/End, typeahead, Enter/Space, Escape, Tab, outside click and disabled state.
- Queue status pills: solid dark status-tinted fill, softer status border, vivid dot and readable text. Use the same meaning everywhere. Slightly shorter desktop toolbar, 44px phone targets, restrained purple action shadow.
- All routes use one sidebar and compact page header, neutral #090909/#101010/#181818 surfaces, #262626 borders, #ededed text, #999 muted, #6d28d9 primary and #9865f5 link/focus. Existing Manrope typography and local FontAwesome icons. No new icon library.
- Case page becomes a full-width review workspace, not a grid of interchangeable cards: a concise case header/revision strip; a compact truthful check-coverage graphic; readable submitted copy with selected excerpts; a structured evidence rail and decision area. Reference, AI opinion and activity remain available with deliberate hierarchy. Do not invent risk scores, throughput, historical progress or legal clearance. AI remains advisory and separate from deterministic checks.
- Submission is a coherent editor with campaign context, copy/evidence, and an adjacent self-check area. Offer library is a browsable reference surface with clear terms/example copy and a direct start-submission action. Retain offer deep links and unknown-context paths.

## Accuracy and behavior
Preserve all API contracts and existing revision/role/expectedRevision guards, conflict recovery, excerpt bounds checks, manual findings, feedback, current-revision decisions, AI persistence/promotion and input validation. No backend changes unless a verified integration bug requires one. Approval is exact-revision copy approval, not permission to publish. Unknown checks never appear passed. Historical views remain read-only. No unsent draft loss due to cosmetic filters or role changes.

## Validation
Build/TypeScript and existing backend/model tests; targeted behavioral tests only for new logic. Browser checks desktop/phone, loading/error/empty states, custom-select keyboard and dismissal, catalog deep links, valid/invalid submission, self-check, evidence navigation, revisions, role controls, decision guards and AI display. Run workflow mutations only in an isolated demo workspace, not on shared seed records. Finish with Claude critique and focused code review, resolve material findings, update existing PR and deploy frontend.
