# ClearPath: product thesis and research

Prepared November 3, 2026. This is a proposed product direction, not an additional specification from PromptArmor. Sam's handoff and subsequent instruction to define the product are the complete assignment available to us. Implementation is pending this product-definition discussion.

Revised after independent reviews by Claude Opus, Claude Sonnet, GPT-6 Astra, and GPT-6.1 Sol. See [review decisions](reviews/2026-11-03-thesis-review.md). The reviewers supported the core direction but identified gaps in executable checks, revision handling, regulatory applicability, and scope.

## What is established

- ClearPath Financial offers personal loans, credit cards, and mortgage prequalification online, including through affiliate partners.
- Its compliance marketing team uses Excel and email; reviews are bottlenecking growth.
- The requested outcome is increased review throughput.
- Vikram explicitly named product intuition and accuracy as evaluation criteria. The rubric is focused on product functionality.
- Deliverables are a deployed project and GitHub repository. The working deadline is November 4 around 6:15 p.m. Pacific; the precise cutoff is not independently confirmed.
- Sam has clarified that no further spec is available. We must define the product and record assumptions.

## Evidence about the hiring team

PromptArmor's current [Product Engineer posting](https://www.promptarmor.com/careers/product-engineer) emphasizes understanding workflows and pain points, intuitive user experiences, relational schema design, and ownership across data models, APIs, and interfaces. This is direct evidence about the advertised role, not a disclosure of the take-home rubric.

Its [product positioning](https://www.promptarmor.com/) centers on accelerating assessment and monitoring changes across third-party AI assets. Its [TPRM page](https://www.promptarmor.com/tprm) describes gathering inputs, enriching them with risk information, and supplying that information to existing workflows. Company marketing is evidence of positioning, not independent proof of performance.

The company-published [HubSpot case study](https://www.promptarmor.com/hubspot-claude-implementation-case-study) describes helping reviewers distinguish controls needed before deployment from acceptable residual risks. It connects better risk understanding to faster adoption. This is a named customer account published by the vendor, not independently audited outcome data.

### Inference for this exercise

The transferable problem is helping a constrained review team make informed decisions at the speed the business needs. Demonstrating that pattern would be relevant to a product engineering role at PromptArmor. We do not know that the assignment was deliberately selected as an analogy.

| Signal | Proposed demonstration in ClearPath |
| --- | --- |
| Understand user pain | Reduce gathering context, repeated checks, and revision coordination |
| Intuitive product | Reviewer can identify the next action without training |
| Accuracy | Correct findings and dependable behavior: saves persist, transitions are consistent, and decisions apply only to the intended revision |
| Relational modeling | An approval belongs to an exact content version and policy context |
| End-to-end ownership | New submission proceeds through changes, re-review, and a persisted decision |
| Risk review supports growth | Clean work moves quickly; difficult work reaches a human with useful context |

Founder backgrounds are supporting context. The kickoff and job description carry more weight than guessing personal preferences from biographies. Nothing establishes a requirement for AI agents, Python, a particular model, or a clone of PromptArmor's interface.

## What the industry adds

A [PerformLine credit-union customer story](https://content.performline.com/customer-stories/credit-union-implementation) describes a manual loop: marketing submits a document, compliance checks and edits it, marketing revises it, then compliance reviews it again. The vendor describes institution-specific rulebooks and collaboration as parts of the solution. This supports a workflow hypothesis; it does not validate any performance claim for ClearPath.

Financial marketing review depends on the product, offer, channel, and claim:

- [Regulation Z §1026.24](https://www.consumerfinance.gov/rules-policy/regulations/1026/24/) addresses closed-end credit advertising, including actually available terms, APR presentation, and disclosures triggered by certain advertised terms. A personal-loan or mortgage scenario must be evaluated against its applicable provisions, not a universal word blacklist.
- [Regulation Z §1026.16](https://www.consumerfinance.gov/rules-policy/regulations/1026/16/) has separate open-end advertising provisions, including introductory and promotional-rate disclosures. Credit-card examples therefore need different checks from personal-loan examples.
- The [FTC's final Credit Karma order](https://www.ftc.gov/news-events/news/press-releases/2023/01/ftc-finalizes-order-requiring-credit-karma-pay-3-million-halt-deceptive-pre-approved-claims) settled charges involving deceptive preapproval and approval-odds claims. This is a concrete reason to check substantiation and context. It does not make every use of “preapproved” unlawful.
- [FFIEC social-media guidance published by FDIC](https://www.fdic.gov/news/financial-institution-letters/2013/social-media-consumer-compliance-risk-management-guidance) discusses oversight, third-party relationships, changes, and records. Its applicability depends on the institution. For our product design, it motivates preserving channel and partner context; it does not establish ClearPath's charter or exact legal obligations.

These sources inform a bounded demonstration. They do not provide an exhaustive legal rulebook. We should distinguish regulatory references, invented ClearPath policies, and product facts in both data and UI.

**Applicability correction:** The card demonstration must specify a complete, standalone promotional landing page. Section 1026.16(g)(5) exempts qualifying banners/pop-ups linked to electronic applications or solicitations from (g)(4), not all advertising requirements. Missing asset format or destination means this check's applicability is unknown. Applications/solicitations require a separate scope assessment. Text extraction alone does not establish visual prominence. The linked CFPB provisions govern the check; an excerpt or keyword alone does not establish its applicability.

## Proposed fictional operating context

These are assumptions for Sam to accept or change, not facts supplied by the evaluator:

1. ClearPath markets U.S. consumer financial products. Its legal entity type, charter, licensing footprint, and lending-versus-brokerage arrangements remain unspecified; avoid inventing regulatory labels based on them.
2. A small central compliance team reviews copy from internal marketing and affiliate partners before publication.
3. The initial deliverable handles text-based assets and revisions, with source/channel metadata and an explicit complete-asset versus excerpt distinction. Visual presentation remains a separate review requirement.
4. A human makes the final copy-review decision. The demo labels this “Copy approved”; it does not grant publication clearance when layout or other required review has not happened. Automated analysis prepares evidence and suggestions.
5. Reviewers need a queue, context, actionable findings, revision history, and a durable decision record.
6. A product owner maintains canonical offer terms; compliance maintains policy guidance. The demo contains explicitly fictional, versioned examples of both as read-only reference data. Their administration is outside the first release.
7. We have no measured baseline for volume, review time, false positives, or throughput. Any sample workload is demonstration data, not business research.

### Reference material to create before application logic

| Material | Contents | Purpose |
| --- | --- | --- |
| Product and offer catalog | Product identity, transaction-specific fictional terms, audience/channel applicability, intended offer dates, provenance and version | Compare copy to the applicable snapshot, rather than an assumed universal current rate |
| Policy pack | Rule identifier, source type, applicability, trigger, exceptions, evidence needs, version and limits | Make a finding explainable and reproducible |
| Example submissions | Internal and affiliate copy spanning the three product categories | Exercise the real workflow with coherent data |
| Expected review outcomes | Definite mismatches, likely concerns, acceptable copy, and missing context | Evaluate both useful detection and false alarms |

Avoid inventing a large brand history, organizational chart, or market forecast. Create the facts that make review decisions meaningful.

Reference preparation should be bounded: one coherent offer per product category and a small initial check set. Capture expected outcomes before implementation, including negative and unknown-context cases. An independent reviewer should author a small holdout set without seeing the check implementation. Model-authored holdouts provide an additional challenge; they are not external legal validation.

## Proposed product thesis

**ClearPath helps compliance reviewers move marketing submissions to a defensible decision with less reading, research, and back-and-forth.**

The core unit is a review case containing a particular asset revision, its offer and policy context, findings, reviewer dispositions, and a decision.

### Where the time savings should come from

These are workflow hypotheses, not measured facts about ClearPath.

| Suspected time sink | First-release mechanism | Observable demonstration |
| --- | --- | --- |
| Incomplete submissions and obvious errors | Shared checks available before submission; missing context is explicit | Submitter repairs a rate mismatch before a reviewer opens it |
| Finding the right reference | Applicable offer and policy appear beside the copy | Reviewer can verify the cited value without another search |
| Writing feedback and chasing status | Structured change request built from confirmed findings; submitter status view | Marketer receives the requested edits in the case and resubmits there |
| Re-reading revisions | Whole-content recheck with a diff and finding changes | Reviewer sees what changed, what persists, and what needs judgment |
| Overprocessing straightforward cases | Compact coverage summary and one-action copy approval after review | Clean supported copy does not require a rationale on every passing check |

### Workflow

1. A marketer or affiliate enters copy, product/offer, publisher, channel/format, intended launch date, and whether the full asset is provided. Destination or supporting evidence is requested when a selected check depends on it. Unknown products can be submitted with their limitations visible.
2. The submitter can run the same checks used by the reviewer and correct obvious problems before submission. Missing context routes the case to “Needs information”; unresolved concerns can still be submitted for human judgment.
3. A bounded, executable check set runs against the current revision and selected references. Results distinguish checked, finding, unable to evaluate, and not applicable. Findings include an excerpt when present; absence findings name the missing element and scope searched rather than inventing a quote.
4. Status tabs separate “Needs information,” “Ready for review,” “Waiting on submitter,” and “Decided.” Within a status, show launch date and age. Findings explain concern severity where justified; there is no opaque aggregate risk score.
5. A reviewer examines content and evidence, confirms or dismisses findings, and can add a manual finding. Reasons are required for dismissals/overrides. A change request packages confirmed findings into actionable feedback visible on the submitter's case page.
6. Marketing revises and resubmits. Every check reruns against the whole revision. The screen shows a diff plus findings that persist, newly appear, or are no longer detected. “No longer detected” does not automatically close a manual concern or prove a regulatory issue is resolved. Previous judgments remain visible as history, not inherited clearance.
7. Human copy approval records the exact content version, offer/policy context, reviewer, decision, any required rationale, and time. A later edit creates a new revision without approval. Broader publication review remains outside the copy decision's stated scope.

### Accuracy boundaries

- An offer mismatch is distinguishable from a possible misleading claim or absent context.
- A reference must support the particular finding; the presence of a citation alone is insufficient.
- A clean automated result means no issues were found within the checks performed. It is not an automatic statement of legal compliance.
- Required but missing evidence cannot silently turn into a pass.
- A partial asset, unknown product, uninspected link, or failed check reports its specific coverage gap. Zero findings with zero applicable checks is not a clean review.
- Findings computed for one revision cannot attach to another; failed or stale analysis cannot enable approval. Refreshing a page preserves submissions, feedback, and decisions, and repeated clicks do not create conflicting decisions.
- An unchanged excerpt does not prove its context is unchanged. Do not automatically carry a finding disposition forward merely by matching text; an offer change or a deleted disclosure elsewhere can matter.
- Suggested replacement copy cannot invent a product term or claim. The reviewer sees its basis before accepting it.
- Pattern-based claim checks are labeled as requests for judgment or substantiation. They must account for straightforward negative/control examples and never present keyword presence as a legal conclusion.
- A match against a fictional catalog establishes consistency with that selected snapshot. Future-dated offers are assessed against the planned publication period; prelaunch review is not itself evidence that an offer is unavailable.
- Product rules and applicability matter: an introductory card APR, a mortgage interest rate, and a personal-loan APR are not interchangeable.
- If a model is used, submitted content is untrusted data. It cannot instruct the model to change policy, suppress findings, call tools, or approve an asset. Decisions remain application-controlled.

## Scope recommendation

### First complete release

- Live deterministic checks on new submissions and all revisions, grounded in a small read-only catalog/policy pack. Findings are generated from content, not prewritten seed results.
- Submitter intake, self-check, case status, actionable change requests, and resubmission.
- Reviewer queue organized by status and launch date, without first-release assignment management or advanced search.
- Side-by-side asset and evidence review.
- Human finding dispositions, manual findings, and copy-approval/change-request decisions.
- Revision comparison, whole-content rechecks, and persistent decision history.
- A straightforward clean-copy path with an honest coverage summary and one human approval action.
- Seed cases and independent holdout inputs covering clean content, mismatch, judgment, missing context, applicability exceptions, and a successful revision.
- A clearly labeled single-workspace demo identity/role switch, if used; it is not production authentication or access control.

### Potential extensions after that workflow works

- Structured model-assisted analysis for semantic claims, grounded in the same catalog and policies.
- Reusable approved language and treatment of repeat findings.
- Post-publication affiliate monitoring.
- Broader file formats and rendered-layout assessment.
- Catalog/policy administration, advanced search, assignments, and production identity/access management.

Do not make the demo depend on broad crawling, every regulatory regime, enterprise SSO, automatic publishing, or an arbitrary risk score. The request does not establish those needs. Automation is valuable when it reduces reviewer work with acceptable error rates.

## What the demonstration should prove

Start with the complete copy of a standalone affiliate card product landing page, outside the banner/pop-up exception, for an explicitly defined purchase offer. The selected fictional terms establish the expected introductory and ongoing rates and duration. The system finds omissions within this stated scope and supports a human change request. On resubmission, deliberately insert a duration inconsistent with the offer to demonstrate a genuinely new result. After correction, record human copy approval for that version, with rendered presentation still outside the automated check scope.

Then exercise a clean case, unknown context, a format exception, and an unseen edit. The evaluator must be able to paste new copy and get a computed result. A check failure must be distinguishable from a successful check with no finding.

Instrument actual submission, first-action, change-request, revision, and decision events. Show the demo's own timeline and revision count. Decisions per reviewer-hour and cycle-time improvement are future evaluation measures requiring a baseline; seeded dates or a short scripted run do not establish business gains. Report fixture and holdout misses and false flags, with the authorship and small sample clear. Demonstrate removed workflow steps without claiming measured minutes saved.

## Decisions still to settle

- Starting recommendation after review: transparent deterministic checks are required in the first release. A model is optional follow-on work, not a dependency for the core demonstration or a stated hiring requirement.
- Initial intake is text with asset-format/completeness metadata. The exact UI for coverage limits and human copy review is still to be designed.
- Fictional product terms and policies, with explicit labels separating them from external regulations.
- Persistent backend and deployment target. TypeScript/React is Sam's working preference, not an evaluator mandate; no infrastructure has been selected or provisioned.

## Session state

- Repository initially contained only a README and has no application implementation.
- Sam authorized initializing CodeGraph after source files exist.
- Research references originally named under `~/workspace/` were unavailable at those exact paths on this machine; the supplied handoff is the source for interview details.
- The handoff's claim that Ropes & Gray was the only named customer story is no longer exhaustive: the current site also publishes the HubSpot account linked above. This changes available public context, not the project requirements.
