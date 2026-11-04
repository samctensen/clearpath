# ClearPath first release

Implementation authorized by Sam on November 3, 2026. User-selected architecture: **two deployable apps in one repository, Deno backend, Next.js frontend, Neon Postgres**. Atlas supplies familiar architectural patterns, not business code. Root owner integrates; workers own disjoint files.

## Product and design

Implement the reviewed `docs/product-thesis.md` as a complete copy-review workflow. One fictional offer per product in `packages/checks/catalog.ts`. A server-generated, browser-specific demo workspace isolates visitors. A labeled reviewer/submitter switch demonstrates roles, not production authentication.

Visual direction: a calm professional review desk, navy navigation (#142C3A), teal action (#087F8C), cool background (#F3F6F8), white surfaces, slate text (#243746), amber concerns (#AC6B12). Manrope for UI, readable document copy. Compact sidebar, generous working surface, status tabs, dense useful queue; no landing-page hero or decorative metric cards. Main detail is content left/evidence right. Forms, empty states, errors, keyboard focus, and mobile stacking must work.

## Contract

`packages/contracts/mod.ts` is the shared source for types and input validation. The API returns JSON values directly on success; errors are `{error:{code,message}}`. Actor is a demo role from `x-demo-role: reviewer|submitter`, default reviewer. This is simulation, not access control.

All routes are under `/api`; Next proxies them to `API_ORIGIN` to keep the browser same-origin. API creates a signed HttpOnly SameSite=Lax workspace cookie. Production must require COOKIE_SECRET and DATABASE_URL; local embedded Postgres is allowed only outside production. All DB reads and writes scope to workspace. Do not log copy or credentials. Never fetch submitted URLs.

| Method / route | Request | Response |
| --- | --- | --- |
| GET /health | — | `{ok:true,storage:'postgres'|'pglite'}` |
| GET /catalog | — | `{offers:Offer[],policyVersion:string}` |
| POST /analyze | SubmissionInput | Analysis |
| GET /cases | — | CaseSummary[] |
| POST /cases | SubmissionInput | CaseDetail (201) |
| GET /cases/:id | — | CaseDetail |
| POST /cases/:id/revisions | `{expectedRevision:number,input:SubmissionInput}` | CaseDetail |
| POST /cases/:id/dispositions | `{expectedRevision,ruleId,action:'confirmed'|'dismissed',reason:string}` | CaseDetail |
| POST /cases/:id/manual-findings | `{expectedRevision,title,quote,reason}` | CaseDetail |
| POST /cases/:id/manual-findings/:findingId/resolve | `{expectedRevision,resolution}` | CaseDetail |
| POST /cases/:id/decision | `{expectedRevision,decision:'approve'|'request_changes',note:string}` | CaseDetail |

Revision numbers start at 1. `revisions` and `events` are chronological, current revision last. Dispositions are only for current revision. Current input belongs to last revision, not duplicated on case. `findings`/`unknowns` are current analysis counts. Dates are ISO UTC, launchDate YYYY-MM-DD.

Decisions and dispositions require reviewer role; revisions require submitter. Creation and analysis are available to both demo roles. Requests validate values and bounded sizes at the API boundary. Storage not_found =>404; conflict=>409; invalid=>400; blocked=>422; storage=>500. Malformed JSON is 400, never raw stack traces.

## Workflow invariants

- All six checks run on every new revision; stored analysis is produced server-side.
- A new revision after approval creates an unapproved current version and clears current dispositions. Previous events and decisions stay immutable.
- All mutations compare expectedRevision and serialize with the case row inside a transaction. Old tabs cannot decide newer copy.
- Approval requires every finding/unknown explicitly dismissed with a reason and no open manual findings. Confirmation is a concern to address, not clearance. Passed/not-applicable checks require no disposition. Visual review is outside the explicitly labeled copy-review scope.
- A change request requires at least one confirmed current concern, an open manual finding, or a nonempty reviewer note. Record one actionable event combining feedback and confirmed findings; do not send email.
- Approve/request-changes cannot silently re-decide an already decided version. Return conflict for a duplicate/stale action; no duplicate audit event.
- Manual findings remain open across revisions until the reviewer resolves them with a reason.
- Missing analysis context gives needs_information. Otherwise initial/revised status ready_for_review even if checks flag concerns.
- Local persistence survives server restart; hosted demo uses Neon. No browser localStorage for product records.

## Six bounded checks

1. `review-context`: known matching product/offer, complete content, known format and launch within offer dates. Missing context => unknown. Do not declare future offers unavailable merely because reviewed before launch.
2. `offer-match`: compare explicitly advertised APR values and card introductory duration with selected fictional offer. Distinguish card intro and ongoing values, personal-loan range, unknown mortgage rates. If extraction is ambiguous, return unknown rather than guessing. No % anywhere matching.
3. `card-intro-label`: card introductory rate mentions need intro/introductory nearby, under the bounded text check; no legal certification. Other products not applicable.
4. `card-promo-terms`: standalone complete card text advertising intro APR should include promotional duration and ongoing APR. Confirmed banner linked to an application => not applicable for this rule; banner destination unknown=>unknown; no blanket banner exemption for other checks. Scope/reference §1026.16(g)(4)-(5).
5. `loan-repayment`: for personal-loan text, a specific number of payments, repayment period, or payment amount requests human verification of the full repayment disclosure. APR alone and generic monthly-payments language are not triggers. Do not claim the checker validates amortization. Other products not applicable.
6. `approval-claims`: explicit assertions of guaranteed approval or already/pre-approved status request human substantiation under a fictional ClearPath policy. Avoid matching straightforward negations (“not guaranteed”, “not pre-approved”) or “check whether you may prequalify.” Provided substantiation stays a human review concern, never automatically verifies the claim.

Presence findings quote exact bounded offsets. Absence findings omit excerpt. Analysis scope explicitly says text only. For missing applicability information, legal-style checks return unknown; never imply a clean result when zero checks can establish anything.

## Acceptance scenarios

- Complete card landing page “0% intro APR on purchases.” flags missing promo terms; correct catalog copy clears targeted checks.
- Same short copy as banner linked to application skips only card-promo-terms; unknown destination yields unknown.
- Correct card copy changed from 12 to 18 months produces a live mismatch.
- Loan “From 9.99% APR. Monthly payments available.” does not trigger loan-repayment; “36 monthly payments” does.
- “From 8.99% APR” mismatches selected 9.99% minimum offer; an unknown offer produces unknown, not mismatch.
- Mortgage “You're already approved” requests judgment; catalog prequalification language does not.
- Unresolved concerns block approval; dismissal without reason fails; old expectedRevision conflicts; editing approved copy invalidates approval; workspace isolation holds.

## Deployment

Frontend target Vercel; API target a Deno-compatible service (Deno Deploy or container host); Neon via DATABASE_URL. No Vercel login is currently available. Prepare reproducible local execution and deployment artifacts while account setup is unresolved. Do not claim deployed until a live URL is verified.
