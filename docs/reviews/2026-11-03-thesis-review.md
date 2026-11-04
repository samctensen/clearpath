# Independent review of the ClearPath product thesis

November 3, 2026. Requested by Sam before implementation. Four reviewers received the same unmodified thesis independently and returned read-only critiques; none implemented application code. This record summarizes the coordinator's decisions rather than treating agreement among models as validation.

## Reviewers

| Reviewer | Scope | Method |
| --- | --- | --- |
| Claude Opus 5.5 | Product thesis, throughput mechanisms, day-one scope | Claude Code; read-only file and public web tools |
| Claude Sonnet 5.5 | Reviewer/submitter journey, feasibility, test circularity | Claude Code; read-only thesis analysis, no external fact verification |
| GPT-6 Astra | Employer sources and interpretation of hiring expectations | Independent agent, official-source verification |
| GPT-6.1 Sol | Regulatory applicability and useful evaluation cases | Independent agent, primary regulatory sources |

Claude's runtime reported `claude-opus-5-5` and `claude-sonnet-5-5` as the main review models. Opus's runtime also reported auxiliary Haiku usage. Both Claude runs completed successfully with no denied tool requests. The GPT model names are the requested agent configurations.

## What survived scrutiny

- The official [Product Engineer posting](https://www.promptarmor.com/careers/product-engineer), [product site](https://www.promptarmor.com/), [TPRM page](https://www.promptarmor.com/tprm), and [HubSpot story](https://www.promptarmor.com/hubspot-claude-implementation-case-study) support the public-source descriptions in the thesis. These describe company positioning and vendor-published customer experiences, not independently audited outcomes.
- The supplied handoff remains the source of interview statements. We did not independently inspect the original recording, interview transcript, or a hidden rubric.
- The central proposal survives: a complete review case with evidence, revisions, and a human decision can address the stated problem.
- No reviewed source establishes an LLM requirement, mandatory Python stack, or deliberate assignment/product analogy.

## Accepted refinements

1. **Make executable checks mandatory in the first release.** Astra and Opus independently identified an omission: assisted checks appeared in the workflow but were not explicit in the release scope. Require results computed from current content and demonstrate unseen edits. Seed assets are legitimate; prewritten findings masquerading as analysis are not.
2. **Include application correctness in accuracy.** The handoff's definition is broader than detecting issues. Persist submissions and decisions, prevent stale analysis from approving a later revision, and preserve consistent state across refresh and repeated actions.
3. **Specify the submitter half of the loop.** Both Claude reviews found it underdeveloped. Reuse the check engine for pre-submission guidance and expose status, exact change requests, and resubmission in the case.
4. **Make re-review visibly cheaper.** Run checks over the entire revision, show a diff and finding changes, and retain past human judgments as context. Never infer fresh clearance solely from an unchanged excerpt or a disappeared detection.
5. **Add regulatory applicability and coverage to the data contract.** Sol identified the banner/pop-up exception in [§1026.16(g)(5)](https://www.consumerfinance.gov/rules-policy/regulations/1026/16/). The coordinator verified it directly. The flagship now specifies a standalone landing page; format or destination uncertainty stays visible. Text review is labeled as copy review, with visual presentation outside its automatic coverage.
6. **Reduce scope to protect the core loop.** Use status tabs and read-only reference data first. Defer administration, advanced search, assignment management, and production authentication. A demo role switch must be labeled honestly.
7. **Test against more than our own happy path.** Sonnet highlighted circularity when one author invents rules, examples, and expected answers. Freeze expectations before implementation, add negative and missing-context pairs, and use independently authored holdouts. This adds scrutiny without making the sample a legal certification.
8. **Demonstrate time-saving mechanisms without fabricated metrics.** Instrument real events and show fewer coordination steps. Quantified business improvement requires a baseline; simulated timestamps cannot supply one.

## Suggestions qualified or declined

- **“Ready to approve” based on checks alone:** declined as a system conclusion. Clean supported copy can have a quick human decision path, but absent flags do not establish overall compliance. Show coverage and unknowns explicitly.
- **Automatically carry dispositions forward using a matching excerpt:** deferred. Context and references can change without the excerpt changing. Day one retains judgments as history and reruns checks; any later reuse needs reliable dependency tracking.
- **Resolve findings by rule ID plus normalized excerpt:** useful as a comparison hint, insufficient as a resolution rule. Missing-element findings may have no excerpt, repeats can collide, and manual concerns require a human disposition.
- **Interpret all approval words as violations:** declined. A transparent phrase detector may request substantiation, but context, negation, and known support matter. The Credit Karma example does not establish a universal banned-word rule.
- **Treat the whole regulatory audit as a feature backlog:** declined. More legal nuance informs the bounded rules and tests; it does not require a comprehensive legal engine, new regulation families, or full product parity inside 24 hours.
- **Require a model to impress PromptArmor:** no reviewer established that requirement. Transparent checks are the current starting recommendation; a model is an optional extension with measurable benefit and explicit limits.

## A useful disagreement

Opus emphasized automated checks as the main throughput mechanism. Sonnet emphasized coordination and revision handling, and offered a workflow-first fallback if detection proves weak. Neither position is established by customer research. The chosen scope combines a small working check set with the complete correction loop, so the demo can show both mechanisms without building a large analysis platform.

## Verification and remaining limits

- The coordinator reread the original thesis and both complete Claude reports, considered both GPT reports, and independently checked the concrete banner exception.
- Changes are confined to the product thesis and this review record. No app, backend, or hosting service has been implemented or provisioned.
- These are model reviews of a brief, not interviews with ClearPath users or legal review. The asserted workflow bottlenecks remain hypotheses supported by analogous published examples.
- The next design should use the revised thesis and a bounded catalog/check set. Infrastructure choices remain open; no stack is implied by this review.
