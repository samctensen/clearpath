# Decision log and policy guide

Sam requested one or two real destinations for the sidebar, grounded in the product thesis and project direction. The review queue remains part of the review desk; its duplicate sidebar entry is removed.

Two additions implement the thesis's reference-lookup and defensible-decision needs:

- `/decisions`: search past approvals and change requests by campaign, publisher, or feedback; filter by outcome and product; inspect the exact reviewed copy, feedback, policy and offer versions. Include historical decisions after a later revision, label them clearly, and link to that exact revision in the case workspace. Use stored decisions and revision-bound data, never infer a decision from today's case status.
- `/policies`: browse the six implemented checks, search and filter by product, understand applicability and preparation, compare examples, and follow the source. Names and references come directly from the check engine. Distinguish fictional product facts/company policy from regulatory references. Document the check's limits without suggesting automatic legal clearance.

Keep the accepted Manrope typography and existing neutral/purple tokens: canvas #090909, panel #101010, raised #181818, border #262626, text #ededed, accent #9865f5. The decision log uses a record list and revision inspector; the policy guide uses a check index and reading pane. Existing sidebar, headers, dropdowns, icons, and status meanings carry through. Compact source labels and prose serve the task; no fabricated performance measures or decorative metrics.

Read-only additions use existing workspace isolation and existing decision/revision storage. No database migration or new dependencies. The list query fetches decision summaries in one query; exact copy is loaded for the selected case only. Policy examples describe individual checks, not reusable approval.

Validate historical decision retention, revision-specific metadata, recorded feedback, cross-workspace isolation, policy/check correspondence, empty/search states, keyboard controls, desktop/mobile layouts, and production build. Preserve the queue/mobile changes already present in this working tree.

## Initial validation

- `npm run check`, `npm test`: 143 tests passed, including the new decision-history/isolation and policy-guide API tests.
- `npm run build`: both routes compile and prerender successfully. `git diff --check` is clean.
- Local browser at 1440px and 390px: policy selection/deep links, no-result search/reset, keyboard product selection, decision outcome filtering, historical revision copy/checks, mobile selection/focus, and collapsed navigation verified. Neither page overflows horizontally at phone width.
- The existing demo history provided an actual revision-1 change request followed by revision-2 approval. The log shows both, preserves the original short copy, and labels the earlier decision as historical. Browser verification did not mutate existing case records.
- Offer-library policy version and check evidence now link into the guide. New endpoints retain the signed workspace context. No deployment performed as part of this change.

## Claude design review and revision

Claude Opus reviewed fictional demo screenshots and a plain product brief, then a second set of screenshots. No private repository source was sent. The critique is recorded in `../reviews/2026-11-04-reference-pages-claude.md`.

- Decision cards became compact rows. Removed decorative icons, repeated outcome-only feedback, taglines, and duplicate counts. Earlier revisions have an explicit warning in both the list and record.
- Check results are visible by default. Reviewer actions are shown in event order, limited to the selected revision and ending at the recorded decision. Free-text historical events are not falsely attributed to individual checks.
- Decisions have bookmarkable URLs and a copy-link action. Their case links select the exact revision; returning to the current revision clears the URL parameter. A missing requested revision has an explicit unavailable state.
- The guide groups checks by source, searches examples and preparation text, and carries the relevant product into a new blank draft. Example wording is illustrative, not a claim of approval.
- Both pages support mobile selection, direct-link loading, and return to their list. The six-item policy index has no nested scroll region.

Follow-up validation: `npm run check` and `npm run build` passed. Six focused tests passed. After the concurrent queue-pagination work updated its query-string expectations, the full suite passed: 153 tests, zero failures. Browser checks at 1440px and 390px verified historical links, bookmark reload, copied URLs, guide search, product-prefilled drafts, mobile navigation, and no horizontal overflow. Existing demo records were not modified. Claude's follow-up found no visible must-fix issues and described both pages as restrained and content-led; remaining suggestions were optional polish.
