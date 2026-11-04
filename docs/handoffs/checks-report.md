# Check engine report

Implements the six-rule engine described in `docs/handoffs/checks.md` and the "Six bounded checks" section of `docs/build-spec.md`. Nothing was committed.

## Files

- `packages/checks/engine.ts`: `analyze(input): Analysis`, plus `ruleIds` and the `RuleId` type. Pure and deterministic: no network, files, env, clock, or model calls.
- `packages/checks/engine.test.ts`: 19 behavior tests (`Deno.test`, `node:assert/strict`).
- `packages/checks/mod.ts`: re-exports `analyze`, `ruleIds`, `getOffer`, `offers`, `POLICY_VERSION`.

No changes to contracts, catalog, or configs.

## Verification

- Original TDD: all 15 initial tests failed against a throwing stub and then passed against the implementation.
- Refinement baseline: `./node_modules/.bin/deno test --allow-read packages/checks/holdout.test.ts` reproduced the four supplemental defects: `FAILED | 49 passed | 4 failed (14ms)`.
- Added four engine regression tests before changing production code. `./node_modules/.bin/deno test --allow-read packages/checks/engine.test.ts` then returned `FAILED | 15 passed | 4 failed (15ms)`: unrelated durations were findings, the first irrelevant duration was quoted instead of the repayment period, an invitation was a finding, and an invitation's phrase was quoted instead of a separate affirmative claim.
- After the fixes: `./node_modules/.bin/deno test --allow-read packages/checks/engine.test.ts packages/checks/holdout.test.ts` returned `ok | 72 passed | 0 failed (46ms)` with type checking.
- Applied `./node_modules/.bin/deno fmt packages/checks/engine.ts packages/checks/engine.test.ts`: `Checked 2 files`.
- Full suite after formatting: `DENO_NO_PACKAGE_JSON=1 ./node_modules/.bin/deno task test` returned `ok | 82 passed | 0 failed (4s)` (7 API, 19 engine, 53 holdout, 3 model tests), with type checking. An earlier bare `./node_modules/.bin/deno task test` tried to resolve npm workspace packages and failed on registry DNS before test execution; the package.json-prescribed `DENO_NO_PACKAGE_JSON=1` setting avoided that unrelated resolution.
- `./node_modules/.bin/deno check packages/checks/mod.ts`: `Check packages/checks/mod.ts`, exit 0.
- `./node_modules/.bin/deno lint packages/checks/engine.ts packages/checks/engine.test.ts` and `./node_modules/.bin/deno fmt --check packages/checks/engine.ts packages/checks/engine.test.ts`: each returned `Checked 2 files`, exit 0.

All refinement commands used the repo-local Deno 2.9.6. The refinement changed only `engine.ts`, `engine.test.ts`, and this report; independent holdouts, contracts, catalog, and dependencies were not edited.

Test coverage: all six results always appear once, in order. Each acceptance scenario is tested: the promo-terms finding with no excerpt, a linked banner (not_applicable) versus a banner with unknown destination (unknown), 12→18 months, wrong ongoing APR, wrong intro APR, loan "Monthly payments available" versus "36 monthly payments", 8.99% versus the 9.99% minimum, and an unknown or mismatched offer giving unknown. Also covered: mortgage "already approved", negations, substantiation not clearing a claim, inclusive launch-date bounds, future launches allowed, incomplete asset, unknown format or product, intro-label proximity, fee and cash-back percentages ignored, and every catalog `approvedCopy` clearing its own checks. Each excerpt is asserted to equal `content.slice(start, end)`.

Refinement controls cover company age even when the same sentence mentions a personal loan; account-review cadence; actual repayment periods following those unrelated durations; term-before-duration and duration-before-term phrasing; a personal-loan duration; “pay it back over” phrasing; preapproval questions and invitations including contractions; and separate affirmative claims after a question, invitation, or “Don't wait” clause. Findings must quote the actual affirmative claim or repayment term, not the excluded wording.

## Behavior notes for API/UI integration

- **Status meanings:** `not_applicable` means the product or format is out of the rule's scope (including a linked banner for card-promo-terms). `passed` means the rule applies and the scan found nothing to flag, including when the trigger is absent. `unknown` always uses `kind: "missing_information"`.
- **Suggested needs_information mapping:** set `needs_information` when `review-context` is `unknown`. A `finding` there (launch outside the offer window) is a real issue for review, not missing context. Root decides.
- **Incomplete assets (`completeAsset: false`):** absence-based results become `unknown`, never `passed`. Anything actually found is still reported.
- **Unknown product:** card and loan rules return `unknown`, not `not_applicable`, and offer-match returns `unknown`. `approval-claims` still runs because the fictional policy covers every product.
- **offerVersion:** set only when the selected offer exists and matches the product. Otherwise it is `null` and offer-match returns `unknown`. A rate is never compared against a guessed offer.
- **card-promo-terms with unknown destination:** a banner with `linksToApplication: null` returns `unknown` only when the period or the ongoing APR is missing. If both are present it returns `passed`, since the requirement is met either way.
- **References:** labels are stable per rule. Regulatory rules link to the CFPB §1026.16 and §1026.24 pages. `approval-claims` cites "ClearPath policy AC-1 (fictional)" as `company_policy`. offer-match and review-context cite the catalog as `product_fact`.

## Extraction boundaries (limitations)

- **Which percentages count:** only those next to "APR" or "annual percentage rate" are compared. "From X% to Y%" and "X%–Y% APR" ranges share one label, and a "…, then 19.99%." clause continues an APR sentence. A percentage next to "rate" or "interest" is reported as `unknown`, not compared. All other percentages (fees, cash back) are ignored.
- **Card rate roles:** an ongoing rate is recognized by "then", "thereafter", "after that", "after the intro period", or "standard/variable/ongoing APR". An intro rate is recognized by "intro/introductory/promotional/promo" or a months duration in the same clause. With a selected offer, an unlabeled rate equal to the offer's intro rate is treated as the intro rate. Without an offer, it is `unknown`. Clause splitting is punctuation-based, so unusual sentence structure can mis-assign roles.
- **Intro durations:** only months are read: digits, or number words up to twenty plus 21/24/36/48/60. "1 year", "until March 2027", and "billing cycles" are not read. As a result, card-promo-terms may report the period as missing; a reviewer can dismiss that finding with a reason.
- **Intro label proximity:** "intro" or "introductory" must appear within about 30 characters in the same clause. "Promotional" alone does not count. This is a proximity heuristic, not a legal certification.
- **Loan APR roles:** a value marked "from / as low as / starting at" must equal `aprMin`, and "up to / as high as" must equal `aprMax`. Any value outside the range is a mismatch. A single unmarked APR inside the range is `unknown`. Loan term lengths are not compared with `minMonths`/`maxMonths`, which is outside the spec'd scope.
- **loan-repayment triggers:** a number of payments ("36 monthly payments"), a contextual repayment duration ("60-month term", "repayment term of 3 years", "repay over 3 years", "36-month personal loan"), or a payment amount ("$199/mo", "payments as low as $199"). Month/year durations require adjacent repayment, term, or loan wording within bounded before/after windows; company age and account-review cadence do not trigger. Merely mentioning a loan elsewhere does not establish that a duration is a repayment period. This deliberately narrow extractor can miss unusual or distant repayment phrasing and does not infer a repayment period from a standalone duration. Finance-charge amounts are not detected. Payment math and amortization are never validated, and the explanation says so.
- **approval-claims:** catches guaranteed approval or acceptance, pre-approved/preapproved, "already approved", "you're / you've been approved", and "everyone is approved". A claim is skipped when a negator ("not", "no", "never", "isn't", "don't", "without", …) appears among the four preceding words in the same clause; dashes split clauses, so "Don't wait — you're pre-approved" is still flagged. A matched phrase in a clause ending with `?`, or immediately preceded by a bounded "see/check/find out if/whether [you are…]" invitation, produces `unknown` with an uncertainty explanation if no separate affirmative claim is found. A separate affirmative claim still produces a finding and its own exact excerpt. Questions and invitations therefore still need human review, but are not described as explicit approval assertions. This is bounded syntax handling, not general sentence understanding; unusual conditionals, nested questions, punctuation, or negation scope can still be misclassified. "Pre-approval" (noun) and "instant approval" are not matched. Substantiation text is acknowledged in the explanation but never clears the finding.
- **Scope:** text only. Rendered layout, prominence, linked destinations, and overall legal compliance are out of scope. The `scope` string states this.

## Contract or other issues

- No contract changes were needed. One addition: `mod.ts` also exports `ruleIds` and `RuleId`, which the UI may want for ordering and labels.
- **Citation to verify:** the card-intro-label reference is §1026.16(g)(3) ("introductory" terminology), and card-promo-terms cites (g)(4)–(5). These are from memory because network use was not allowed. Root should confirm them against the CFPB page before the demo.
