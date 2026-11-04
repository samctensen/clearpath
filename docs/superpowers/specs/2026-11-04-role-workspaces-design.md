# Distinct reviewer and submitter workspaces

Date: 2026-11-04
Status: Recommended design; planning only. Sam delegated the product choice after floating an earnings chart. No application implementation is included in this document.
Baseline inspected: main fd15157 in /Users/sam/Developer/clearpath/clearpath-frontend. Local browser inspection confirmed 50 fictional submissions; earlier briefs mentioned 18, before concurrent seed changes.

## Decision

Make the reviewer home a decision workspace and the submitter home a feedback-and-revision workspace. Keep the accepted reviewer status-flow map. Give submitters a compact, interactive **Submission journey** for a selected submission, alongside a **Needs attention** list. The full searchable, server-filtered list remains below.

Do not add earnings, activation, a launch calendar, or a generic analytics chart. We have no publication, attribution, commission or payout data. Target dates remain useful context and sorting keys, but are requested dates, not actual launches or review promises.

The distinction must continue into the case page: reviewers judge evidence and decide; submitters understand feedback and prepare a new revision.

## Why this fits the brief

The supplied brief makes review throughput the problem and product intuition/accuracy the evaluation emphasis. This change makes the handoff between roles tangible without expanding the domain. PromptArmor's public Product Engineer listing explicitly values understanding workflows, intuitive interfaces, relational modeling and end-to-end ownership. Alignment with that listing is our inference, not a claim about the private hiring rubric. [Source](https://www.promptarmor.com/careers/product-engineer)

Current implementation uses one ReviewQueue component, one Review desk heading, the same map/table/sidebar, and one largely shared case layout. Role switching changes Up next items, a table label and mutation controls. The current presentation therefore changes permissions more than it changes the job.

## Boundaries and decisions made by the planning agent

- Same Next.js/Deno/Postgres app, same routes and demo-role selector. No auth, accounts, ownership migration, campaign activation state, or payout integration.
- This is one shared demo workspace. Use **Submissions** for the submitter home and **Workspace submissions** for its table. Do not claim personal ownership, hide other publishers as if access were enforced, or normalize publisher text into identity.
- Existing API role checks, workspace isolation, revision conflicts, decision gates, soft deletion and immutable history remain authoritative. UI role labels are not authentication.
- Status values remain unchanged. Submitter presentation maps ready_for_review to **Awaiting review**; needs_information and changes_requested stay distinct within Needs attention; approved remains **Copy approved**.
- Deep-purple actions and existing neutral-dark tokens remain. No large hero, statistic-tile row, progress percentage, synthetic earnings, fake performance improvements, or continuous celebratory animation.
- Keep AI compliance and marketing opinions available to both roles, advisory and collapsed by default. No automatic paid AI requests.
- No inferred approval ETA, financial value, resolved-concern count or risk score from automated finding counts. Passing checks is not approval.
- Seed timestamps are actual demo record creation times. Do not fabricate history or infer a sample-data flag from coincident timestamps. Existing fictional-demo labeling stays visible; no elapsed-time performance chart.

## Role matrix

| Surface | Reviewer | Submitter |
| --- | --- | --- |
| Home | Review desk: existing map, Up next, triage queue | Submissions: Needs attention, selected journey, workspace list |
| Primary action | Open next review when available; creation remains accessible as secondary/demo action | New submission; contextual Revise / Add information |
| List focus | Copy findings, status, target date and reviewer actions | Next step, current revision, target date and submission actions |
| Case focus | Evidence, concerns, dispositions, decision | Reviewer feedback, missing information, copy, revision editor |
| Decision history | Prominent sidebar entry | Available from case history and account menu; less prominent navigation |
| Reference pages | Offer library and Policy guide | Same shared references, unchanged data |
| Mutations | Existing review/disposition/decision rules | Existing revise/delete rules; never resolves reviewer concerns |

New submission remains allowed by the existing API in either demo role; this plan changes visual emphasis, not creation permissions.

## Submitter home layout and behavior

Compact header: **Submissions**, search/product controls, New submission, account icon. Navigation home label follows role. The submitter sidebar foregrounds Submissions, Offer library and Policy guide; Decision log remains accessible through account menu and case history. Reviewer navigation is preserved.

Top row has two purposeful panels:
1. **Needs attention**: up to three changes-requested or information-needed submissions, ordered by valid target date, then creation and ID. Each item shows title, status, target date, a bounded source-labeled snippet and an explicit action. A separate select control previews its journey; Revise/Add information opens the existing current-revision editor. View all selects the combined Needs attention list filter.
2. **Submission journey**: selected title, current revision/state, source-labeled current feedback/missing context, open manual concerns and one next action. A small chronological line shows only submitted, revised, changes-requested and approved events that actually occurred. Nodes open /cases/:id?revision=N. No future approval node, proportional-duration spacing, or synthetic stages.

Initial selection is the first attention item, otherwise the first queue row. Selecting a table row still opens the case: preserve the user's clickable-row behavior. A distinct Preview journey action in the ellipsis menu selects it in the top panel. Do not hijack row navigation.

Search/product filters scope both panels and the table. Status tabs affect the table only; label this scope next to the tabs. Preserve the journey selection while it remains in the search/product cohort. Remove it when filtered out or deleted. On a table-only tab/page change keep selection; if none, select the first row. Explicit selection and filters must not silently change one another.

Bottom table has All / Needs attention / Awaiting review / Copy approved tabs. Needs attention combines needs_information and changes_requested on the server. Counts come from the same search/product cohort, not the current ten rows. Table columns: submission/publisher + revision, product/format, next step, target date, status, actions. Keep server search/sort/direction/keyset pagination, full-row links, custom menus and consequential-action confirmation dialogs. Keep all statuses available through All; no redundant single-status dropdown in submitter mode.

Next steps:
- changes_requested: **Revise copy**, with the request tied to the current revision.
- needs_information: **Add information**, with an automated missing-context label; do not invent a reviewer message.
- ready_for_review: **Awaiting human review**, with current revision submission timestamp. Edit remains a deliberate secondary action.
- approved: **View approved revision**, naming the exact current approved revision. Editing starts a new review; never say Live, Active, Ready to launch, or Publication approved.

## The journey at one revision and at many

At revision 1, the current-state panel does the useful work. A single submission event is sufficient; don't fill empty space with invented nodes. Show the current feedback/context and next action beside it.

Use ordinal, equally spaced nodes. Show exact timestamps in accessible node details, without claiming review speed. An event is bound to its recorded revision. Earlier feedback stays labeled **Feedback on revision N** after resubmission, never repackaged as current feedback.

Show at most the latest four revision groups initially. A Show earlier history control reveals the rest; each group retains its actual submission/decision events. This is a visualization of history, not a percentage of completion. Finding counts, if shown in node details, mean recorded automated findings on that revision, not unresolved human concerns or proof of improvement.

Open manual concerns persist independently of revision/status. Show them read-only for the current case, including after a new revision is submitted; label that reviewer confirmation is still required. A submitter cannot mark them resolved. Current open manual concerns must not be presented as a historical snapshot when viewing an old node.

Mobile: stack Needs attention then the selected journey, with a scroll/focus link from Preview journey. Preserve a real node-and-connector visualization, using a vertical timeline on narrow screens rather than hiding it behind a summary. At 390px, labels and next action must fit without horizontal page scrolling. Nodes work by tap, keyboard and focus, not hover alone. Reduced motion removes movement, not state information.

Zero items: concise submission CTA. No attention items: a calm “No submissions need changes or information” state, then awaiting/approved selection. Failed detail request: local retry inside the journey, keep list usable. Loading: existing card/table skeleton pattern; no full-page loader. Long histories and text must not make the dashboard unbounded.

## Case-page redesign

Keep the existing route and mutation owner. For submitters, place status, current reviewer request and open manual concerns before automated coverage. Separate **Reviewer feedback** from **Automated suggestions**. Show exact copy and offer context; make Revise/Add information the obvious next step. Keep feedback visible alongside the revision editor, read-only. Do not add a separate checklist state that implies a concern is resolved.

After resubmission, show “Revision N submitted; awaiting human review,” earlier feedback explicitly labeled, and any still-open manual concerns. The API may instead return needs_information; always render the actual returned status. Historical revisions stay read-only. Approved copy clearly identifies its revision and approval scope.

Reviewer layout keeps evidence/disposition/manual-concern/decision tools. Do not replace its approved map or introduce new prioritization algorithms in this pass. Existing comparison remains available. New automated finding deltas, risk-priority scores and default “resubmissions first” sorting are deferred.

## Data and performance contract

Extend the existing dashboard endpoint, not a second full workspace fetch:
- Optional submitter view filter (default all) maps to existing statuses in SQL, before count, order and pagination. Reject contradictory non-all status plus non-all view, and non-all view with reviewer role.
- Return bounded current-revision guidance for each submitter page row and at most three attention items. Each snippet is at most 240 Unicode characters, source-labeled and revision-bound. A missing source yields a neutral “Open submission for details,” not generated feedback.
- Bulk-query guidance for the union of the page and three attention IDs. No per-row detail or AI calls, and no histories/copy bodies in list responses. Reviewer requests skip this enrichment.
- Current human guidance is the current revision's changes_requested/approved event only. Current missing-information guidance comes from current unknown checks. Ready-for-review timing comes from current revision.createdAt, not case.updatedAt.
- Fetch full CaseDetail lazily for one selected submission using the existing endpoint. The detail loader is remounted on selected case ID + mutation refresh generation, cancels/ignores stale requests, and only renders detail whose case ID matches selection. A path change alone is insufficient: the existing hook retains prior loaded data. Refresh after mutations. Full detail is already the authorized single-case contract; a slim event endpoint is unnecessary for this bounded change.
- scope=page retains the existing omission of overview/cohort; it also omits attention summaries. Client retains them for the correct role/search/product key.
- No new cache, migration, historical seed backfill, or earnings schema is required.

## Acceptance and demo story

A user can tell their role from the first screen without opening the account menu. Submitter attention leads directly to the relevant revision flow. Reviewer actions stay unavailable in submitter mode and server checks remain in force.

Demonstrate: submit copy → reviewer requests changes and records a manual concern → submitter sees the exact feedback → submits revision 2 → reviewer resolves the concern and approves revision 2 → submitter sees revision 2 copy approval. Journey history names actual revisions; revision 1 feedback does not masquerade as revision 2 feedback. Re-editing approved copy returns the current revision to review.

Verify combined-filter pagination, count accuracy, cross-workspace isolation, stale revisions, role switch during a dialog/edit, deletion during preview, zero/one/many history, keyboard/touch, 390px and desktop. Tests use isolated local fixtures and real transitions; do not mutate production for a demo.

## Review record and rejected expansion

Two independent Claude CLI consultations (product and design), followed by a design follow-up, recommended role-specific work and revision history over earnings. We accepted their workflow emphasis and retained concern visibility. We rejected their suggestions to remove the accepted reviewer map, add demo identities/publisher normalization, collapse mobile history into a label, or equate fewer findings with resolved issues. One proposed ownership migration; this pass instead uses truthful workspace language.

Claude sessions: 146749a5-0d77-40a5-a736-74923596527e (product), d66ac9ec-4137-4083-a060-59922042b182 (design and follow-up). They received a fictional scenario brief, not repository source. Code inspection and browser verification were performed separately by the planning agent.

Earnings can be reconsidered only if publication, attribution and commission data become real product requirements. Not part of this take-home pass.

## Independent builder check

A fresh GPT subagent found two implementation gaps, both resolved in the plan: prevent already-loaded detail from flashing under a new selection using an explicit keyed remount and case-ID guard; freeze a complete top-panel prop contract and leave all table/filter/action state with the integrator. No important product or feedback-semantic questions remained. This check did not authorize implementation; the deliverable remains the requested plan.
