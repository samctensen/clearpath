# Role design review and scroll stability

Claude Opus reviewed thirteen screenshots spanning both dashboards, submitter/reviewer case views, revision editing, creation, decision log, offer library and policy guide. A second review covered the corrected screens and actionable reviewer controls on desktop and mobile. Session: `7dfe1c19-059f-4614-8eca-0dc7979f2f4b`. Inputs were fictional-demo screenshots, not private source. Two implementation agents and an independent cross-review handled the changes.

## Design findings and decisions

- Empty reviewer-feedback cards obscured the real missing-information blocker. Empty feedback is now a muted line; substantive and earlier-revision feedback and open manual concerns remain visible. Missing-information editing starts with the saved revision's automated explanations and explicit Unable to evaluate badges.
- Case actions now match dashboard actions: Add information and Revise copy. Changes-requested notices use the blue status token and explain that a new revision is awaited. Feedback surfaces use the neutral workspace tokens.
- Self-check now precedes final submission controls in DOM and mobile reading order. Desktop retains its side rail and connected form footer, including after check results expand.
- Unsubmitted results are explicitly labelled Draft check. Findings and unable-to-evaluate checks stay visible; passed/not-applicable details are available in a collapsed disclosure. Reviewer blocker terminology matches the rest of the UI.
- Claude accepted the reviewer concern/decision controls, offer library and policy guide; no redesign was needed there.
- The apparent displaced skip link/sidebar was a full-page screenshot artifact. The actual skip link is already fixed-position; no CSS change was warranted.
- The mobile journey remains visible, honoring Sam's explicit preference. Hiding it was declined.
- Legacy decision feedback combines notes and concern descriptions into a single stored string. Claude's suggestion to separate these is recorded as a future structured-data improvement. This pass does not heuristically split or rewrite audit text.

## Scroll cause and fix

Two causes were reproduced: ten queue rows were replaced by four much shorter skeleton rows during requests, clamping the browser to the temporary document bottom; browser scroll anchoring then moved the viewport as different results and overview content arrived.

The dashboard reserves measured settled geometry for pending results, overview/attention/journey panels, tabs, scope note and footer. Pagination and header actions retain disabled geometry without exposing stale destinations or rows. Reservations release on success, empty results or failure. Dashboard scroll anchoring is disabled; there is no saved-position scrollTo loop. Explicit Preview journey/View queue actions retain their intentional navigation.

Search/status/product/sort/pagination remain server queries. Existing native history updates for reference hashes and revision query parameters do not invoke route scrolling; no blanket navigation override was added.

## Verification

- 173 tests passed; frontend/backend type checks and production build passed.
- Desktop original repro: Next page at scrollY 397 ended at 0 before the fix; after the fix it remains 397. Footer reset likewise remains 397.
- An isolated read-only proxy delayed dashboard responses by 1.4 seconds and case detail by 0.9 seconds. Desktop before/pending/settled remained scrollY 453 and document height 1366, while the pending view genuinely contained four skeleton rows.
- At 390px, single-result to empty-result search preserves document height 1628 during loading, then settles to the real shorter result. No horizontal overflow.
- Form checks were expanded in the browser. Desktop footer top exactly equals editor bottom; mobile order is editor, self-check/reference, final controls. No revision or review decision was submitted during visual checks.
- Error/retry cleanup was reviewed statically; no forced API failure was injected. Full suite covers role and decision guards.

Final slow-reset measurement and screenshot evidence are recorded in the integration handoff. Hosted frontend/API were not redeployed in this pass.

Final mobile slow-reset verification: scrollY 511 before, 510.5 during pending subpixel layout, and 511 once all results/journey settled; document height grows from 1355 to 3986 without a viewport jump. The final source also passed production build/type checking. Four passed/not-applicable draft checks expand correctly, while both unknown checks stay visible. Visual evidence: `/Users/sam/.codex/visualizations/2026/11/04/01a1a465-7920-7e62-ac38-349786499b6e/reviewed-case-workspace.png`.
