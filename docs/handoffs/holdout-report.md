# Independent behavior holdout review

## Method

The reviewer authored `packages/checks/holdout.test.ts` from `docs/build-spec.md`,
`packages/contracts/mod.ts`, and `packages/checks/catalog.ts` before reading the
engine or its tests. The reviewer did not inspect or modify the implementation.
These are model-authored behavioral holdouts, not external legal validation.

The original 49 scenarios were written before implementation feedback. After the
implementation owner disclosed possible false flags involving approval invitations
and unrelated durations, the reviewer authored four additional explicit controls
without reading the engine or its tests. These supplemental controls are marked
separately in the test file and are not represented as unseen original holdouts.

Each of the 53 scenarios asserts that all six unique rules run, the analysis names
its text scope and policy version, and every emitted excerpt has bounded integer
offsets whose source slice exactly equals the quoted text. Presence concerns in
selected mismatch, repayment, and approval scenarios must include evidence;
absence concerns must omit fabricated excerpts.

## Coverage

- All three catalog examples and new card phrasing.
- Future publication within the offer window; dates outside it; missing or
  mismatched offer, unknown product or format, and incomplete content.
- Introductory versus ongoing APR, swapped values, reverse sentence order,
  APR before its number, ambiguous unassigned card rates, and unrelated reward
  percentages.
- Changed promotional duration, missing ongoing APR, and reward duration or
  reward percentages that cannot satisfy promotion disclosures.
- Banner/application exception limited to `card-promo-terms`, including known
  false and unknown destinations and an application link on a landing page.
- Personal-loan minimum and maximum direction, shared trailing APR on a range,
  specific payment count, period, amount, and non-triggering loan principal or
  generic monthly-payment language.
- Unknown mortgage APR, ordinary approval negations and prequalification copy,
  explicit assertions, supporting evidence that still requires human review,
  a negated claim followed by a positive claim, and Unicode before cited text.

Dates outside the catalog window may return `finding` or `unknown`, but may not
pass. The specification requires valid dates but does not prescribe one failure
status for a known date outside that window.

## Final results

Required command (latest verification):

```sh
./node_modules/.bin/deno test --allow-read packages/checks/holdout.test.ts
```

**53 passed, 0 failed**, including successful Deno type checking. The reviewer
independently reran this exact command after the implementation refinements. All
49 original holdouts and all four supplemental controls pass. No failures from
this review remain unresolved.

## Resolved defect history

The supplemental controls initially produced **49 passed, 4 failed**. The
following two defect families were reproduced, reported, and subsequently fixed
by the implementation owner. The reproduction details below describe the earlier
behavior; the same active assertions now pass.

### Resolved: approval questions and invitations reported as assertions

Rule: `approval-claims`. The contract applies to explicit assertions of existing
or guaranteed approval. Both inputs below previously produced a `finding`
explaining that the text “Asserts guaranteed or existing approval” and quoted
`pre-approved`:

- `See if you are pre-approved for a ClearPath mortgage.`
- `Are you pre-approved? Explore your options with ClearPath.`

Context: `productId: "mortgage"`, `offerId: "home-start"`; otherwise complete,
known landing-page context within the offer window. Expected: `passed`, or
`unknown` if the bounded extractor cannot confidently distinguish the sentence.
Previous actual: `finding`. These are an invitation and a question, not affirmative
approval assertions. A conservative fallback must not describe either as an
established claim requiring substantiation.

### Resolved: unrelated durations reported as repayment periods

Rule: `loan-repayment`. Both inputs below previously produced a `finding` explaining that
“Specific repayment terms” were found:

- `ClearPath has served customers for 10 years. Rates from 9.99% APR. Monthly payments available.`
  Evidence: `10 years`.
- `Get a free account review every 12 months. Rates from 9.99% APR. Monthly payments available.`
  Evidence: `12 months`.

Context: `productId: "personal_loan"`, `offerId: "flex-personal"`; otherwise
complete, known landing-page context within the offer window. Expected:
`passed`. Previous actual: `finding`. Company age and the cadence of a free account review
do not advertise a repayment period, payment amount, or number of payments. These
false flags unnecessarily blocked the straightforward review path.

Both defect families were reported to root with the exact reproduction copy.
Implementation remains unchanged by this reviewer, and these four assertions
remain active regression tests. All four passed in the final independent run.

### Earlier verification

The first run was blocked before execution by `TS2488` in `engine.ts:551`:
`m.indices![1]` could be undefined. The defect was reported to root and corrected
by the implementation owner before the successful final run.

Provisional behavioral command:

```sh
./node_modules/.bin/deno test --no-check --allow-read packages/checks/holdout.test.ts
```

That earlier provisional run produced **49 passed, 0 failed**. The same original
49 cases subsequently passed the required type-checked command before the four
supplemental controls were added.

## Limits

This is a small, bounded sample of explicit claims. It does not establish broad
natural-language understanding, exhaustive legal coverage, visual prominence,
validity of supplied substantiation, or the correctness of amortization. It also
does not review storage, APIs, roles, revision decisions, or the browser workflow.
