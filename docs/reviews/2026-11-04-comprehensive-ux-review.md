# ClearPath comprehensive UI/UX review

Reviewed November 4, 2026. Baseline: canonical local `main`, `da54942a96bbd1bb65072d88af7c34a09fc39bd3`.

**Verdict:** ClearPath now looks coherent and has a credible product model. A user can understand a single submission and its evidence. The weaker experience is the repeated review loop: interpreting a change request, keeping an unfinished edit, comparing revisions, and returning to the next task. The most urgent presentation problem is contradictory approved seed data, not the visual design.

This review recommends changes; it does not implement them. Application code and stored demo records were not changed. Local main was reviewed, not the older hosted deployment.

## Evaluation standard

The available assignment says ClearPath's financial marketing compliance reviews run through Excel/email and constrain growth. The explicit objective is greater review throughput; the named evaluation criteria are **product intuition and accuracy**, with a functionality-focused rubric. Those are established facts from the handoff. Our interpretation is that the strongest demo should make a defensible decision and the next revision easier to complete. That is a product hypothesis, not a claimed hidden PromptArmor rubric.

The [product thesis](../product-thesis.md) translates that into five tasks: catch incomplete drafts, inspect copy beside relevant evidence, communicate concrete corrections, review a revision efficiently, and approve only the exact reviewed copy. Current [shared state](../handoffs/current-state.md) supersedes old build-spec assumptions about visual styling and per-browser isolation.

Questions used throughout: What is this screen for? Who acts next? What specifically needs attention? What will this action do? Can I recover if I leave or make a mistake? Can I tell what changed and why it was approved?

## Method and coverage

- Two independent real Claude Opus reviews: visual/first-time usability (`34b01d2b-d6af-478f-8aa5-84fff960f59a`, including a supplemental reference-page review) and trust/recovery (`e666f538-83e5-45fa-9c1f-946f6575933d`). Two GPT subagents separately checked current source; the integration owner validated findings in the browser and source.
- Live desktop at 1669 × 969 and mobile at 390 × 844. Fifteen screenshots cover both dashboards, new submission, revision editor, reviewer/submitter cases, approval dialog, offer library, policy guide, and decision log.
- Interactions: switch roles; open case and editor; edit then cancel/reopen; page-two case round trip; open/cancel queue approval; custom dropdown Escape; mobile navigation; expand the AI section. No approval, submission, deletion, reset, or paid AI generation was performed.
- Source inspection covers revision comparison, draft/conflict handling, approval gates, feedback assembly, controls, and seed generation. Historical multi-revision behavior and concurrent-save recovery were assessed from source, not a newly executed end-to-end fixture.
- This is an expert heuristic/code review, not measured user research, a full assistive-technology audit, or a legal assessment. Previously fixed loading-scroll behavior was not relabelled as a new defect.

One proposed private-source transmission to Claude was rejected by automatic approval review. That lane continued locally. A separately accepted trust review completed, and the visual lane used only fictional screenshots and a short task brief. No denied request was retried unchanged.

## What is working

**The case workspace is the strongest surface.** Exact copy, a versioned offer reference, highlighted evidence, check scope, and human actions belong together. The clean case says no concerns were flagged while still requiring human review. The incomplete case explicitly says only an excerpt was provided.

**The roles now have different jobs.** Reviewers get review priorities and checks; submitters get Needs attention, feedback, and next-step language. Ready for review versus Awaiting review is a useful difference in viewpoint. The shared workspace is labelled honestly; it does not pretend to have ownership or production authentication.

**The current visual identity is worth keeping.** Neutral dark surfaces, deep purple actions, vivid status pills, and rounded controls are consistent. The graphical map scales to mobile without horizontal overflow in the tested viewport. Table cards remain readable. The next gains are hierarchy and content quality, not another palette or chart replacement.

**The reference pages teach well.** Offer library has usable terms and a Start with this example action. Policy guide separates applicability, preparation, judgment, and references. The decision log retains exact copy and reviewer actions. AI is collapsed/advisory; the tested local configuration clearly reports that it is unavailable while keeping ordinary review usable.

**Several interaction details are already solid.** Custom dropdown Escape returned focus to its trigger. Cancelling a queue confirmation returned focus to the row action button. Source includes keyboard navigation, reduced-motion handling, revision checks, mandatory dismissal reasons, and evidence-offset validation. These are strengths to preserve, not a claim of complete accessibility certification.

## Findings, in priority order

### 1. Approved demo examples contradict their own offer terms — fix before presenting

**Verified in browser and source.** The initially selected decision-log record, Everyday Credit Card — referral drive 031, is Copy approved. Its copy offers **18 months** of introductory APR; the recorded CARD-2026.11-v1 offer allows **12 months**. The checker correctly reports an offer-match finding. The seed dismissed it with “Reviewed for this fictional example” and recorded “Reviewed against the fictional catalog snapshot.”

The generated seed chooses content and outcomes with the same modulo cycle; its approved path dismisses every finding/unknown with the generic reason. This is not evidence that the checker missed the problem or that an unresolved finding bypassed the gate. It is an implausible human decision embedded in the demo, which damages the accuracy story immediately.

**Small fix:** make ordinary approved fixtures actually match their offer and context. If an override example is retained, use a plausible, specific rationale and make the exception visible in the log. Add one deliberate, labelled sample with a real request → revision → approval history so the demo demonstrates the return loop. Do not silently rewrite real decision history or reset the shared hosted workspace as part of this review.

Evidence: [seed.ts](../../apps/api/src/seed.ts), `dispositionsFor` lines 237–244 and generated variants/outcomes lines 294–343; live decision-log record above.

**Acceptance:** every approved fixture is explainable from its recorded offer, evidence and rationale; an obvious 18-versus-12 mismatch is not casually green-lit.

### 2. Re-review still requires manual rereading — highest-value workflow improvement

**Verified in source.** Compare with previous renders both complete texts and counts concern changes by rule ID. It does not highlight inserted/deleted wording, changed metadata, or changed evidence under a persistent rule. Changing one incorrect rate to another remains “still flagged.” An identical text with a changed offer or completeness setting has no context comparison.

**Small fix:** provide a readable text diff and a compact changed-context summary (offer, format, completeness, date, supporting evidence). Distinguish unchanged concern evidence from updated evidence. Keep whole-copy checks and human judgment; a highlighted diff must not imply unchanged sections are approved.

Evidence: [case-review.tsx](../../apps/web/src/components/case-review.tsx), `RevisionComparison`, lines 383–398.

**Acceptance:** a reviewer can locate an 18→12 change and a format-only change without manually comparing full documents. A same-rule evidence change remains visible.

### 3. Feedback loses specificity at the point of editing

**Verified in browser and source.** Needs attention, the case banner, the editor, and decision-log rows display joined audit text such as “Align the copy ….; loan-repayment: Align the copy ….” The sentence repeats and exposes an internal rule ID. In the loan revision editor, the specific “36 monthly payments” evidence and useful next step are left on the case page; the editor shows the vague paragraph and “No checks run yet.” Missing-information editing has better saved-context guidance, so the problem is not universal.

**Small fix:** display a reviewer note plus separate requested-change items with readable titles, exact quotes and next steps. Bring those items into the editor as clearly labelled **feedback on the saved revision**, separate from checks on the unsaved draft. Preview the assembled request before sending. Preserve legacy audit strings, rather than regex-rewriting history or hiding all concerns.

Evidence: [models/mod.ts](../../packages/models/mod.ts), lines 952–957; [submission-feedback.tsx](../../apps/web/src/components/submissions/submission-feedback.tsx); live winback 002 case/editor.

**Acceptance:** a submitter can answer “What do I change, where, and why?” from the editor without returning to the case page or interpreting machine identifiers.

### 4. Unfinished work has weak protection and recovery

**Discard reproduced in browser; conflict path verified in source.** Editing copy → Cancel immediately exits. Reopening restores only the saved copy, with no warning or recovery. Role changes and navigation can also unmount component-local draft state. A stale revision save preserves the field values while mounted, but shows a generic error and offers no practical refresh/rebase path; repeated submission retains the obsolete revision number.

**Small fix:** protect dirty input on cancellation, navigation and role switching; retain a recoverable draft using an appropriate scoped mechanism. Keep untouched cancellation immediate. On revision conflict, offer the latest saved revision while preserving the user's text; do not silently rebase or submit it against changed context.

Evidence: [submission-form.tsx](../../apps/web/src/components/submission-form.tsx), state and save/error paths; [case-review.tsx](../../apps/web/src/components/case-review.tsx), role/edit conditions and revision save at line 362.

**Acceptance:** dirty cancellation asks before discard; role switching cannot silently erase edits; a conflicting save provides recovery without requiring the user to lose or manually reconstruct their copy.

### 5. Approval safety and instructions vary by entry point

**Dialog observed; direct case submission verified in source.** Queue approval presents exact copy, checks, revision and scope in a confirmation dialog. Case Approve copy immediately submits. The user's earlier requirement was to confirm important actions. Separately, blocked-approval text says to dismiss remaining concerns before approval, even after a reviewer has confirmed a valid concern. That can teach the wrong mental model: clearing warnings instead of resolving problems.

**Small fix:** use the same final confirmation pattern from the case page. Explain the branches plainly: valid concern → request changes; incorrect finding → dismiss with a reason; missing context → request the specific information. A confirmation is not needed for every routine check interaction.

Evidence: [review-actions.tsx](../../apps/web/src/components/review-actions.tsx), lines 127–130; [queue-action-dialog.tsx](../../apps/web/src/components/dashboard/queue-action-dialog.tsx), lines 116–134.

**Acceptance:** both approval paths disclose the exact revision and copy-only scope before committing. Confirmation of a problem points toward a correction request, not toward dismissing it.

### 6. New submissions assert complete coverage by default

**Verified in browser and source.** The new form starts with Product/Offer/Format unknown, but Copy provided already says Complete asset. A user can leave that assertion untouched. Unknown context is a supported workflow and correctly becomes Needs information; it should not become a submission dead end.

**Small fix:** require an explicit Complete asset/Excerpt only choice for new submissions, with an initially unanswered UI state. Preserve recorded choices when editing an existing revision. Keep deliberate Unknown options and explain their consequence. Mark required fields clearly. In missing-information guidance, name the actual missing item rather than listing every possible missing field.

Evidence: [submission-form.tsx](../../apps/web/src/components/submission-form.tsx), `emptyInput` lines 20–22; [engine.ts](../../packages/checks/engine.ts), review-context handling lines 379–408.

**Acceptance:** a new submitter explicitly confirms completeness; an intentionally incomplete submission still succeeds with a clear Needs information outcome.

### 7. Reviewers lose their place in the queue

**Reproduced in browser.** Page two showed submissions 11–20. Opening buyer guide page and using its Review queue link returned to 1–10. Filters persist, but cursor/page context does not. After a decision, the case offers no explicit next-review action.

**Small fix:** retain queue filters, ordering, page/cursor and return position when entering a case. Offer Return to queue and Next review after a decision; do not auto-advance unexpectedly. Handle a now-empty page after a decision deliberately.

Evidence: [review-queue.tsx](../../apps/web/src/components/review-queue.tsx), first-page initialization and persisted filter state; [case-review.tsx](../../apps/web/src/components/case-review.tsx), header return link.

**Acceptance:** opening a page-two case and returning restores the same cohort and location; finishing a case offers an obvious next task.

### 8. Mobile repeats context before reaching the working list

**Observed; proposed treatment needs usability testing.** Needs attention, an automatically selected journey, and the submission list repeat the same first record. In the captured mobile submitter dashboard, the list starts roughly 1,400 px down and the page is about 4,000 px tall. Row cards are readable, but combining tall cards with repeated overview material adds scrolling. The journey with only a Submitted event carries little information.

**Small fix:** keep Needs attention prominent; open a compact journey on explicit selection, or make the single-event state much smaller. Keep the reviewer map, with stronger overdue cues in date cells and an actionable past-target filter. Avoid another row of metrics. Validate whether users can reach a specific submission and return without losing orientation.

**Acceptance:** mobile retains the chart and readable evidence but reaches the queue sooner; no unnecessary duplication of the selected record's full explanation.

## Secondary refinements

- Historical case finding cards omit their inline dispositions; the rationale remains in Activity and in Decision log. Link to the relevant historical decision or render read-only dispositions beside the old check. Never inherit them as current clearance.
- The submitter New submission back link says Review queue rather than Submissions. Fix this small vocabulary inconsistency. Preserve intentional role-specific status wording and the requested icon-only account button; its accessible name already includes the role.
- Make overdue dates easier to recognize without mentally comparing them to today. Current priority ordering and past-target count exist; this is visibility, not missing prioritization.
- Approved-over-dismissal records deserve a visible exception count in the decision list. The underlying reviewer actions already exist in the detail view.
- The original build spec describes old colors and per-browser isolation. Mark superseded decisions clearly so submission documentation tells the same story as the current product.

## Review suggestions not adopted

We are not replacing the map with status tiles, restoring a text-heavy role switch, or forcing identical wording for both roles. Those suggestions ignore explicit product preferences or useful role context. Mobile Needs attention already limits itself to three items. A role-aware accessible account name and status/+N queue navigation already exist.

Two source-review claims were rejected: the context check prevents an all-not-applicable false-clean scenario, and confirmed/manual concerns are already included in change requests. The issue is presentation quality, not missing feedback. A visible Skip to content link in a focused screenshot is not by itself a defect. No contrast/accessibility failure is asserted without measurement.

## Small implementation batches

1. **Presentation integrity and safe decisions:** correct approved fixtures; require explicit completeness on new submissions; align approval confirmation and blocker wording. Verify seed scenarios and both action entry points.
2. **Complete the correction loop:** structured feedback in the editor, dirty-draft/conflict recovery, and text/context diff. Give each piece separate ownership and focused tests; review together against one real two-revision fixture.
3. **Keep people moving:** restore queue return context, add explicit next-review navigation, reduce redundant mobile journey space, and finish terminology/overdue cues.

Before declaring the experience easy, run one uncoached task with a fresh person: find a submission needing attention, explain the concern, revise it, inspect the change as reviewer, and approve the exact revision. Observe hesitation and wrong turns; do not invent a throughput improvement percentage. A coherent full loop is stronger evidence for the assignment than more dashboard decoration.

## Evidence artifacts

Fifteen current screenshots and Claude's visual output are saved locally at `/Users/sam/.codex/visualizations/2026/11/04/01a1a465-7920-7e62-ac38-349786499b6e/clearpath-ux-audit/`. The trust review output remains at `/private/tmp/clearpath-ux-audit-trust/review.json`. These are review artifacts, not deployed product assets.
