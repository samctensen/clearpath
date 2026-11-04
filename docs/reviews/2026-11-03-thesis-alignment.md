# ClearPath: thesis against the deployed product

Reviewed November 3, 2026, Pacific time. Baseline: [product thesis](../product-thesis.md), [original review decisions](2026-11-03-thesis-review.md), the deployed app, and current source. This is a product assessment, not a new evaluator requirement or legal review.

## Judgment

The product strongly demonstrates a defensible review process. It partially demonstrates the thesis's throughput promise: less reading, reference lookup, and back-and-forth. The correction loop and reliable decisions are present; revision comparison and work selection still leave avoidable effort with the reviewer.

Keep the thesis. Improve the experience of doing the next review, then test the hypothesized benefit with real use. More infrastructure or a broader analysis engine is not currently the strongest next investment.

## Alignment

| Thesis mechanism | Current evidence | Assessment |
| --- | --- | --- |
| Catch obvious errors before compliance receives the draft | Submitter self-check computes the same bounded rules used on persisted revisions; changing 12 to 18 months produces a new offer mismatch | Strong implementation; fewer reviewer touches remains a hypothesis |
| Put the right reference beside the copy | Exact excerpts, reference types, offer terms, and policy/offer versions are available in the review screen | Strong within the bounded text scope |
| Replace feedback email and revision chasing | Confirmed concerns feed a change request; the submitter revises the same case; history persists | Strong implementation; the demo role switch does not establish real team adoption |
| Make re-review visibly cheaper | Whole-revision analysis reruns, but comparison is two unannotated text blocks and rule-level counts | Partial; the promised visible diff is missing |
| Help reviewers choose useful work | Status filters, counts, search, product filtering, and target-date sorting exist; default is all statuses; no waiting age or returned-revision cue | Partial; selection still needs interpretation |
| Move clean supported copy through a short human decision path | Passing checks are collapsed in review; approval is one action after blockers are cleared | Strong; retain human review and explicit coverage boundaries |
| Preserve accurate decisions | Revision-bound transactions, stale-write rejection, persistent manual concerns, and workspace isolation are tested | Strong application evidence, not exhaustive detection or legal validation |
| Demonstrate increased throughput | Events and revisions exist; no real customer baseline or observed reviewer study exists | Not established; do not invent a percentage improvement |

## Recommended next implementation pass

### 1. Show changes that matter to re-review

The current [RevisionComparison](../../apps/web/src/components/case-review.tsx) renders both full copies without inserted/deleted spans. It counts concerns by rule ID. A duration mismatch changing from 18 to 24 months is still counted as the same flagged check; the change in evidence is not summarized. Changes in offer, format, completeness, launch date, or supporting context are not compared.

Add a readable word-level diff, a compact list of changed review context, and a comparison of each rule's status and evidence/explanation. Describe the latter as check-result changes: the contract has one result per rule, not a complete inventory of distinct legal issues. Keep the full text and whole-revision recheck available; an unchanged passage may still matter to the new context. Never inherit a disposition or resolve a manual concern from a comparison result.

Acceptance:

- A 12-to-18 edit is visually locatable without reading both copies end to end.
- An 18-to-24 edit marks the same rule's evidence as changed, rather than merely saying it is still flagged.
- Identical copy with a changed offer, format, completeness flag, or evidence shows the changed context explicitly.
- A previous concern becoming absent is labeled no longer detected, not legally resolved; open manual concerns and approval guards remain intact.

Impact: high and directly tied to the thesis. Risk: moderate; constrain the work to presentation/comparison rather than introducing automatic finding identity or clearance reuse.

### 2. Make the queue explain the next action

The [queue](../../apps/web/src/components/review-queue.tsx) initially mixes actionable, waiting, and approved cases. It breaks equal launch-date ties by most recent update. The six seed cases all share November 15, 2026, so the demo does not illustrate deadline ordering. Age is absent, despite appearing in the thesis. In the live browser, selecting Ready for review, opening a case, and using its Review queue link returned to All submissions; the chosen filter was lost.

Add a role-appropriate action view: review new/returned copy, request missing information, or revise requested copy. Keep every state accessible. Show returned revisions, launch urgency, and genuine waiting age. For equal deadlines, consider oldest waiting work first. Derive review waiting age from the latest submission/resubmission, not `updatedAt`, because confirming a concern should not reset the waiting clock. Give fictional examples varied target dates, without inventing historical waiting-time measurements.

Acceptance:

- A reviewer can identify a returned revision, an approaching deadline, and the oldest equally dated case without opening each case.
- Missing-context cases remain visible with an information-request action; they must not disappear behind a ready-only default.
- Waiting and approved cases remain retrievable, and queue filters survive a case visit.
- Any displayed age agrees with the relevant real event, including after a disposition changes.

Impact: high. Risk: low to moderate; a small summary-contract addition may be needed. Assignments and an SLA engine are unnecessary for this increment. The best default is a hypothesis to test with Sam, not an established institutional policy.

### 3. Time-box first-visit performance work

Two recorded fresh hosted initializations took 11.4 and 13.5 seconds. The only initial message is “Loading submissions…”. This is a first-use problem even though the workflow eventually succeeds. The earlier parallel-seeding change failed in hosting and was reverted; its cause is not established.

Follow-up: the [list performance investigation](2026-11-03-list-performance.md) found repeated detail hydration and expensive demo initialization. The deployed fix reduced median fresh/returning list requests from 10.21/1.75 seconds to 1.06/0.44 seconds in three samples. The workflow and three concurrent visitor checks passed. This addresses the measured delay; it does not establish a customer throughput improvement or close the comparison and queue-actionability gaps above.

Profile initialization and transaction/query round trips before changing concurrency. Prefer reducing redundant database work while preserving atomic state and isolated visitor workspaces. If a delay remains, explain that the demo workspace is being prepared and provide a useful failure/retry state. Do not share one mutable sample workspace as a shortcut.

Acceptance: compare a small, stated sample of fresh-cookie timings before and after the change, verify coherent seed states and isolation, and reproduce or explain any observed failure. A sub-three-second target is a proposed usability budget, not a promise or a measured result. Keep the currently verified release available if diagnosis expands.

Impact: high for first use and evaluation. Risk: uncertain until profiling. Run this investigation independently of the comparison and queue work.

## Validate the throughput hypothesis

Have Sam use a few new examples before reading the expected check outputs. Include a clean case, a changed term, missing context, and a revision where text stays the same but applicability changes. Record where he pauses, which references he opens, what he misinterprets, and any missed or false flags. After the UI increment, repeat comparable tasks and report only the observed sample.

The demonstration should make removed work visible: self-correction before submission, reference verification in the case, feedback assembled from findings, a visible revision change, and an exact-revision decision. The existing timeline is sufficient for this pass. A throughput dashboard or invented minutes-saved figure would not validate the hypothesis.

## Independent reviews and coordinator corrections

Claude Sonnet 5.5 and an independent GPT agent reviewed the original thesis plus a [shared current-product evidence packet](../handoffs/thesis-alignment-review.md). They did not perform a fresh legal review or usability study. Root checked the suggestions against CodeGraph/source and the live UI. Both ranked revision comparison first. GPT placed queue actionability second; Claude placed first-visit performance second. The recommendation is to pair comparison and queue work while separately time-boxing performance diagnosis.

Corrections to the review suggestions:

- Per-tab counts already exist. Dismissal reasons are required. The live queue already includes Needs information. These are not missing features.
- The 53 model-authored holdouts were independently authored relative to the implementation; calling them wholly non-independent is inaccurate. They are not human/customer or legal validation, and four supplemental cases were added after disclosed failures.
- The shared contract has one result per rule. A proposed test requiring multiple independently tracked findings from one rule would expand the data model; defer that change. Compare each existing result's content instead.
- Identical seed deadlines conceal the sorting feature in the initial demo; they do not make sorting impossible to test.
- A visual diff should orient review, not imply that unchanged context may be ignored.
- An LLM is not inherently incompatible with accuracy. It should earn scope by improving a measured task and managing uncertainty. The present evidence supports improving the existing workflow first.

## Boundaries

No new application feature was implemented during this assessment. Keep production identity, assignments, notifications, rendered-file review, wider regulation coverage, and a semantic model as later candidates with a concrete user need. Repository invitations remain deferred at Sam's request.

The original evaluation signals remain product intuition and accuracy. A reviewer who can find the next case and understand a revision quickly gives stronger evidence of product intuition; a decision that survives real edits and retains clear limits gives stronger evidence of accuracy. Neither depends on guessing undocumented hiring-team preferences.
