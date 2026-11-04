# AI opinions on marketing submissions

Sam requested an OpenAI-powered opinion on marketing offers and selected **both compliance and marketing feedback, shown separately**. Existing session direction delegates implementation choices and requests parallel agents and Claude co-review. The choices below are implementation decisions, not additional hiring-team requirements.

## Product

Add an **AI second opinion** panel to a saved case revision. Both demo roles may generate and read it. One button, **Generate AI review**, produces two clearly labeled sections:

- **Compliance second opinion**: summary, potential concerns with exact copy excerpts when available, explanation, suggested change, supplied reference identifiers, and unanswered questions.
- **Marketing feedback**: summary, strengths, and specific suggestions for clarity, tone, and persuasiveness, including optional quoted passages and suggested wording.

The review is advisory and does not approve copy, dismiss checks, resolve manual concerns, change status, or edit the submission. Marketing suggestions must preserve the supplied offer facts and disclosures. A reviewer may deliberately add a suggested concern through the existing manual-finding workflow; this is a human action and uses existing revision guards. Keep that action unavailable on historical/approved revisions and for submitters.

The initial scope is saved submissions, not an open-ended chat or unsaved-draft assistant. New revisions require their own AI review. Historical revisions can display an existing opinion but cannot trigger generation. Show the revision number, model, generation time, and an explicit advisory label. Do not invent a confidence percentage or legal/marketing performance score.

## Grounding and provider

The Deno backend calls the OpenAI Responses API with a strict structured-output schema. Default model: `gpt-5.4-mini-2026-03-17`, configurable with `OPENAI_MODEL`. Official documentation confirms Responses and Structured Outputs support: https://developers.openai.com/api/docs/models/gpt-5.4-mini and https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses . A schema constrains format, not factual accuracy.

Supply the immutable revision input, its deterministic analysis and references, and the selected offer only when its ID/product/version match the revision's saved context. Missing or mismatched offer context must remain explicit. Send no other visitor data, cookie, credentials, unrelated cases, or hidden history. Treat every submission field as untrusted data, never instructions. Give the model no tools, URL fetching, or database access. It may cite only supplied rule reference IDs and `offer` when an offer is supplied; it must not invent external legal citations. Validate quoted excerpts against the exact input text and validate all reference IDs before saving. Reject malformed, refused, incomplete, or unverifiable outputs with a useful generic error; never present a fabricated fallback as an AI result.

Use one provider request for both sections, `store: false`, a 40-second timeout, a bounded output token limit, and no automatic provider retries. Use medium reasoning effort. Live evaluation exposed unsupported interpretations and qualification changes at low effort; prompt v5 adds explicit missing-context, repayment-trigger, qualifier-preservation, and process-claim boundaries. These reduce observed errors but do not guarantee semantic accuracy. API secrets stay server-side. The UI explains that generation sends the revision and offer context to OpenAI. A missing key leaves the rest of ClearPath working and the panel explains unavailability.

## Storage, API, and cost

Persist one successful review per `(case_id, revision)` with model, prompt version, content hash, generation timestamp, and structured content. Repeated requests return the saved review without another provider call. Model/prompt changes do not silently replace an existing result; a new content revision can generate a new review. Store this separately from deterministic analysis and human decisions. No AI data or AI calls are added to the queue endpoint or to normal case-detail loading.

Add `GET /api/cases/:id/ai-review?revision=N` returning `{ available, review }`, where review is null if none exists. Validate workspace ownership and revision existence. Add `POST /api/cases/:id/ai-review` with `{ expectedRevision }`, returning the same envelope on success. Clients never supply the prompt or a replacement analysis. Reject historical/stale generation with 409, unknown/foreign cases with 404, unavailable configuration with 503, provider failures with 502 (timeout 504), and exceeded quota with 429.

Before a paid call, reserve one request in a database transaction against a daily global limit (default 50, `AI_REVIEW_DAILY_LIMIT`) and a daily per-workspace limit of 10. Count attempts, including failed provider requests. Use UTC calendar days and atomic counters so multiple application instances cannot exceed the configured request budget. Reuse cached results before budget checks. Coalesce duplicate in-flight requests within one API instance. Across instances, unique persistence accepts one result and both attempts count against the hard budget. This bounds spend without Redis or adding a job queue.

Never hold a database transaction open during the provider call. On save, lock/check the case's current revision; if a new revision was submitted while generation ran, reject with 409 and do not attach the result to the new revision. Do not update case status, updatedAt, or event history merely because an AI opinion was generated.

## Concrete content contract

`AiReviewContent` contains:

- `compliance`: `{ summary, concerns: [{ title, quote: string|null, explanation, suggestedChange, referenceIds: string[], severity: "high"|"medium"|"low" }], questions: string[] }`
- `marketing`: `{ summary, strengths: string[], suggestions: [{ title, quote: string|null, rationale, suggestedRewrite }] }`

Limit each concerns/suggestions list to six, questions/strengths to five, title to 160 characters, quote to 2,000, summaries and individual explanation/rewrite text to 1,600. Plain strings render as text, not HTML. `AiReview` adds `revision`, `contentHash`, `model`, `promptVersion`, and `createdAt` to this content. `AiReviewResponse` is `{ available: boolean, review: AiReview|null }`.

## Delivery and acceptance

Root owns contracts, provider implementation, integration, deployment, and live checks. Backend agent owns storage, migrations, budget, and API routes/tests. Frontend agent owns the panel, existing review-page integration, and styling. Use isolated file ownership in the same checkout, not duplicated worktrees. Claude performs an independent review before release.

Tests must prove malformed/refused responses and invented excerpts are rejected, untrusted instructions remain data, saved reviews are reused, cross-workspace access is denied, stale responses cannot attach to a new revision, concurrent budget consumption stays bounded, and AI output cannot change approval state. Browser checks cover both sections, generation/loading/failure states, current versus historical revisions, both demo roles, and narrow screens. Existing 92 tests, type checks, build, and workflow smoke must continue passing. Measure queue loading again to confirm AI is not on its critical path.

No OpenAI key was present in process environment or this project's env files during initial inspection. Sam has been asked to add it to ignored `.env.deploy`; live provider calls and enabling the hosted feature depend on that. Build and provider-boundary tests can proceed without a secret. Do not claim live AI quality based solely on mocked responses.

## Builder review decisions

- POST must check expectedRevision against the current revision before returning a cached result; historical cached reads use GET. Save checks under the same case row lock used by edits. A concurrent uniqueness loser returns the persisted winner, unless the revision changed, which remains 409.
- Coalesce in-flight calls by workspace/case/revision and remove the promise in finally. Reserve both quotas in a consistent global-then-workspace order using the transaction's database-derived UTC date; any cap failure rolls back both increments.
- Quotes must be exact, contiguous, case-sensitive substrings of `revision.input.content`, not other fields. Reference IDs come from supplied analysis plus `offer` only when a matching offer is present.
- `contentHash` has the same meaning as the existing revision's hash: submitted copy text. The immutable revision identity binds input metadata and analysis. Do not describe contentHash as a hash of the entire model context.
- Generation on an approved current revision is permitted and remains advisory. Promoting a concern is limited to a current unapproved revision. `available` means provider configuration is present, not that quota or upstream service health is guaranteed. Saved results remain readable with available=false.
- Sam has now confirmed the key was added to ignored `.env.deploy`; root will verify presence without printing it and perform bounded live tests.
- Concern promotion uses the existing `canReview` lifecycle guard, excluding both approved and changes-requested cases. This avoids new reviewer mutations while waiting for a revised submission. Generation remains available for any current revision.
