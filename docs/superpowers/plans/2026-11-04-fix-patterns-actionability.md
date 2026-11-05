# Fix-pattern actionability follow-through

Approved by Sam after the thesis review, 2026-11-04. Baseline main2808481. Goal: make chart selection explain the recorded correction and lead directly to the existing editor, without adding another dashboard panel.

## Lanes and ownership

- Backend subagent: page-only current-revision guidance for selected reason; model/API regressions. Owns model guidance, passing reason from Store.dashboard, relevant backend tests.
- Claude frontend implementer: existing queue, chart and their styles; reason definition display labels only. Show recorded guidance and direct Add information/Revise copy links. Preserve row interaction and navigation.
- Independent Claude critique: bounded fictional product brief and final UI/code review. Root adjudicates and verifies.
- Root: integration, browser checks, full checks/build and small main commits/push. No deployment or shared data mutation/reset; .claude remains untracked.

## Acceptance

- Selecting a second reason returns its own recorded explanation/request, not the first unrelated check. Latest current revision only.
- Legacy prose remains unclassified; manual notes and unavailable sources stay honest. No urgency/approval inference from chart length.
- Attention row explains the correction and offers an explicit link to existing editor; whole-row navigation, menu, keyboard, mobile and return context work.
- Source distinction visible in chart/selected chip; no new panel or speculative analytics.

## Progress

- [x] Backend implementation and focused tests
- [x] Claude frontend implementation
- [x] Independent review and necessary fixes
- [x] Integrated tests/typecheck/build and desktop/mobile navigation proof
- [x] Commit/push main and update handoff


## Review and verification

- Actual Claude Sonnet frontend implementer: 16fa1674-00e9-4589-a598-1572587fd999; scoped refinement 6a15a4c5-b123-4eaa-b4d7-13e5df39b071. Opus independent critique: 682f061b-0e8d-4687-8eec-50f2e12a18c7. No denied Claude tool actions. Source access was bounded to relevant UI files; critique used fictional screenshot and brief.
- Accepted critique: show multiplicity, distinguish missing information, use Revise submission to cover copy or metadata, keep labels coherent. Backend exposes distinct readable itemCount; selected guidance previews the first recorded matching source. General summary remains, also with count where available.
- Retained status wording Needs information and matched source/meta labels instead of changing global statuses. Kept frequency order and honest legacy notes; classification or priority cannot be inferred from legacy prose. Default explanatory text kept short. Existing CSS stretched link requires z-index layering, not unnecessary event propagation blockers.
- Backend agent was interrupted by revoked application network permission after implementation. Root completed the remaining count/test adjustments; fresh independent code review returned clear pass.
- Final npm test:225 passed. npm run check and npm run build passed; git diff --check passed. Tests cover second-reason selection, current revision/latest request, unrelated sources, readable malformed data, multi-item counts, legacy fallbacks and visible Unicode truncation.
- Browser confirmed actual specific missing-asset feedback appears in the queue, direct Add information opens existing revision editor with saved feedback, and return restores the scrolled queue. No form submitted/data mutated. Browser connection then became unavailable; final selected-reason/mobile recapture was not completed. Those selected-source semantics are covered by isolated regressions; responsive link sizing was reviewed in CSS. No viewport override was applied this pass; demo role stayed Submitter as found.
- Backend commit a6b6cd8; frontend and this handoff follow in a second commit. No deployment.
