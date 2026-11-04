import assert from "node:assert/strict";
import type { Analysis, CheckResult, SubmissionInput } from "../contracts/mod.ts";
import { analyze, getOffer, offers, POLICY_VERSION, ruleIds } from "./mod.ts";

const cardCopy = getOffer("everyday-card")!.approvedCopy;
const loanCopy = getOffer("flex-personal")!.approvedCopy;
const homeCopy = getOffer("home-start")!.approvedCopy;

const card = (overrides: Partial<SubmissionInput> = {}): SubmissionInput => ({
  title: "Everyday card landing page",
  productId: "card",
  offerId: "everyday-card",
  content: cardCopy,
  format: "landing_page",
  publisher: "Affiliate Partner",
  launchDate: "2026-12-01",
  completeAsset: true,
  linksToApplication: false,
  substantiation: "",
  ...overrides,
});
const loan = (overrides: Partial<SubmissionInput> = {}): SubmissionInput =>
  card({
    title: "Flex loan email",
    productId: "personal_loan",
    offerId: "flex-personal",
    content: loanCopy,
    format: "email",
    ...overrides,
  });
const home = (overrides: Partial<SubmissionInput> = {}): SubmissionInput =>
  card({
    title: "HomeStart social",
    productId: "mortgage",
    offerId: "home-start",
    content: homeCopy,
    format: "social",
    ...overrides,
  });

const check = (analysis: Analysis, ruleId: string): CheckResult => {
  const found = analysis.checks.filter((result) => result.ruleId === ruleId);
  assert.equal(found.length, 1, `expected exactly one ${ruleId} result`);
  return found[0];
};
const status = (input: SubmissionInput, ruleId: string) => check(analyze(input), ruleId).status;
const assertExactExcerpt = (input: SubmissionInput, result: CheckResult, text: string) => {
  assert.ok(result.excerpt, `${result.ruleId} should quote the copy`);
  assert.equal(result.excerpt.text, text);
  assert.equal(input.content.slice(result.excerpt.start, result.excerpt.end), text);
};

Deno.test("every analysis returns the six rules once, in order, with versions and text-only scope", () => {
  assert.deepEqual(ruleIds, [
    "review-context",
    "offer-match",
    "card-intro-label",
    "card-promo-terms",
    "loan-repayment",
    "approval-claims",
  ]);
  for (
    const input of [
      card(),
      loan(),
      home(),
      card({
        productId: "unknown",
        offerId: null,
        format: "unknown",
        completeAsset: false,
        linksToApplication: null,
      }),
    ]
  ) {
    const analysis = analyze(input);
    assert.deepEqual(analysis.checks.map((result) => result.ruleId), ruleIds);
    assert.equal(analysis.policyVersion, POLICY_VERSION);
    assert.match(analysis.scope, /text/i);
    for (const result of analysis.checks) {
      assert.ok(
        result.title && result.explanation && result.reference.label,
        `${result.ruleId} is fully described`,
      );
      if (result.excerpt) {
        assert.equal(
          input.content.slice(result.excerpt.start, result.excerpt.end),
          result.excerpt.text,
        );
      }
    }
  }
  assert.equal(analyze(card()).offerVersion, "CARD-2026.11-v1");
  assert.equal(analyze(card({ offerId: null })).offerVersion, null);
});

Deno.test("analysis is deterministic", () => {
  const input = card({ content: "0% APR on purchases for 18 months. You're pre-approved!" });
  assert.deepEqual(analyze(input), analyze(input));
});

Deno.test("approved catalog copy clears the targeted checks for each product", () => {
  const cardResult = analyze(card());
  for (
    const id of [
      "review-context",
      "offer-match",
      "card-intro-label",
      "card-promo-terms",
      "approval-claims",
    ]
  ) {
    assert.equal(check(cardResult, id).status, "passed", id);
  }
  assert.equal(check(cardResult, "loan-repayment").status, "not_applicable");

  const loanResult = analyze(loan());
  for (const id of ["review-context", "offer-match", "loan-repayment", "approval-claims"]) {
    assert.equal(check(loanResult, id).status, "passed", id);
  }
  for (const id of ["card-intro-label", "card-promo-terms"]) {
    assert.equal(check(loanResult, id).status, "not_applicable", id);
  }

  const homeResult = analyze(home());
  for (const id of ["review-context", "offer-match", "approval-claims"]) {
    assert.equal(check(homeResult, id).status, "passed", id);
  }
  for (const id of ["card-intro-label", "card-promo-terms", "loan-repayment"]) {
    assert.equal(check(homeResult, id).status, "not_applicable", id);
  }
});

Deno.test("standalone card copy advertising only an intro APR is missing promo terms, without an invented quote", () => {
  const input = card({ content: "0% intro APR on purchases." });
  const analysis = analyze(input);
  const promo = check(analysis, "card-promo-terms");
  assert.equal(promo.status, "finding");
  assert.equal(promo.excerpt, undefined);
  assert.match(promo.explanation, /period|months/i);
  assert.match(promo.explanation, /after|ongoing/i);
  assert.match(promo.reference.label, /1026\.16\(g\)\(4\)/);
  assert.equal(promo.reference.type, "regulatory_reference");
  assert.equal(check(analysis, "card-intro-label").status, "passed");
  assert.equal(check(analysis, "offer-match").status, "passed");

  assert.equal(
    status(card({ content: "0% intro APR on purchases for 12 months." }), "card-promo-terms"),
    "finding",
  );
  assert.equal(
    status(card({ content: "0% intro APR on purchases, then 19.99% APR." }), "card-promo-terms"),
    "finding",
  );
  assert.equal(
    status(
      card({ content: "Simple rewards for everyday spending. No annual fee." }),
      "card-promo-terms",
    ),
    "passed",
  );
});

Deno.test("linked banner exception applies only to card-promo-terms; unknown destination is unknown", () => {
  const content = "0% intro APR on purchases.";
  const linked = analyze(card({ content, format: "banner", linksToApplication: true }));
  assert.equal(check(linked, "card-promo-terms").status, "not_applicable");
  assert.equal(check(linked, "card-intro-label").status, "passed");
  assert.equal(check(linked, "offer-match").status, "passed");
  assert.equal(
    check(
      analyze(
        card({
          content: "0% APR on purchases for 12 months.",
          format: "banner",
          linksToApplication: true,
        }),
      ),
      "card-intro-label",
    ).status,
    "finding",
  );

  const unknownDestination = check(
    analyze(card({ content, format: "banner", linksToApplication: null })),
    "card-promo-terms",
  );
  assert.equal(unknownDestination.status, "unknown");
  assert.match(unknownDestination.explanation, /link|destination|application/i);
  assert.equal(
    status(card({ content, format: "banner", linksToApplication: false }), "card-promo-terms"),
    "finding",
  );
  assert.equal(
    status(card({ content, format: "email", linksToApplication: true }), "card-promo-terms"),
    "finding",
  );
});

Deno.test("changing the card intro duration from 12 to 18 months is a quoted mismatch", () => {
  const input = card({ content: cardCopy.replace("12 months", "18 months") });
  const result = check(analyze(input), "offer-match");
  assert.equal(result.status, "finding");
  assert.equal(result.kind, "mismatch");
  assertExactExcerpt(input, result, "18 months");
  assert.match(result.explanation, /12/);
  assert.equal(result.reference.type, "product_fact");
});

Deno.test("wrong ongoing or intro card APR is a mismatch; non-rate percentages are ignored", () => {
  const ongoing = card({ content: cardCopy.replace("then 19.99% APR", "then 17.99% APR") });
  const result = check(analyze(ongoing), "offer-match");
  assert.equal(result.status, "finding");
  assertExactExcerpt(ongoing, result, "17.99% APR");
  assert.match(result.explanation, /19\.99/);

  const intro = card({ content: cardCopy.replace("0% intro APR", "1.99% intro APR") });
  assertExactExcerpt(intro, check(analyze(intro), "offer-match"), "1.99% intro APR");

  // The ongoing value must not satisfy the intro slot just because 19.99% appears somewhere.
  assert.equal(
    status(card({ content: "19.99% intro APR for 12 months, then 0% APR." }), "offer-match"),
    "finding",
  );
  assert.equal(
    status(
      card({ content: "Earn 2% cash back on every purchase. 3% foreign transaction fee." }),
      "offer-match",
    ),
    "passed",
  );
});

Deno.test("intro rates need an intro label in immediate proximity", () => {
  const unlabeled = card({
    content: "0% APR on purchases for 12 months from account opening, then 19.99% APR.",
  });
  const result = check(analyze(unlabeled), "card-intro-label");
  assert.equal(result.status, "finding");
  assertExactExcerpt(unlabeled, result, "0% APR");
  assert.match(result.reference.label, /1026\.16\(g\)\(3\)/);

  const interest = card({ content: "0% interest for 12 months, then 19.99% APR." });
  assertExactExcerpt(interest, check(analyze(interest), "card-intro-label"), "0% interest");
  // Interest wording is not an APR, so offer-match does not guess.
  assert.equal(check(analyze(interest), "offer-match").status, "unknown");

  // "Promotional" alone is not the required term; a distant "introductory" is not proximate.
  assert.equal(
    status(
      card({ content: "0% promotional APR for 12 months, then 19.99% APR." }),
      "card-intro-label",
    ),
    "finding",
  );
  assert.equal(
    status(
      card({
        content:
          "Introductory offer for new cardholders. Enjoy 0% APR on purchases for 12 months, then 19.99% APR.",
      }),
      "card-intro-label",
    ),
    "finding",
  );
  assert.equal(
    status(
      card({ content: "Intro APR of 0% for 12 months, then 19.99% APR." }),
      "card-intro-label",
    ),
    "passed",
  );
  assert.equal(
    status(card({ content: "A card with a 19.99% APR and no annual fee." }), "card-intro-label"),
    "passed",
  );

  // Without a selected offer an unqualified 0% APR may or may not be introductory.
  assert.equal(
    status(card({ offerId: null, content: "0% APR on purchases." }), "card-intro-label"),
    "unknown",
  );
});

Deno.test("personal-loan repayment terms: generic payment language is not a trigger, specific terms are", () => {
  const generic = loan({ content: "From 9.99% APR. Monthly payments available." });
  assert.equal(status(generic, "loan-repayment"), "passed");
  assert.equal(status(generic, "offer-match"), "passed");

  const count = loan({ content: "From 9.99% APR. Repay in 36 monthly payments." });
  const counted = check(analyze(count), "loan-repayment");
  assert.equal(counted.status, "finding");
  assertExactExcerpt(count, counted, "36 monthly payments");
  assert.match(counted.reference.label, /1026\.24\(d\)/);
  assert.doesNotMatch(counted.explanation, /amortization is (correct|valid)/i);

  const amount = loan({
    content: "Payments as low as $199/mo with a ClearPath Flex Personal Loan.",
  });
  assertExactExcerpt(amount, check(analyze(amount), "loan-repayment"), "$199/mo");
  const period = loan({ content: "Choose a 60-month term for your Flex Personal Loan." });
  assertExactExcerpt(period, check(analyze(period), "loan-repayment"), "60-month");

  assert.equal(
    status(
      loan({ content: "Borrow up to $40,000 for your next project. Subject to credit approval." }),
      "loan-repayment",
    ),
    "passed",
  );
  assert.equal(
    status(card({ content: "Pay over 36 monthly payments." }), "loan-repayment"),
    "not_applicable",
  );
});

Deno.test("personal-loan APR range comparisons and unknown offers", () => {
  const low = loan({ content: "From 8.99% APR. Apply today." });
  const lowResult = check(analyze(low), "offer-match");
  assert.equal(lowResult.status, "finding");
  assertExactExcerpt(low, lowResult, "8.99% APR");
  assert.match(lowResult.explanation, /9\.99/);

  assert.equal(
    status(loan({ content: "APRs range from 9.99% to 24.99%." }), "offer-match"),
    "passed",
  );
  assert.equal(status(loan({ content: "Rates 9.99%–24.99% APR." }), "offer-match"), "passed");
  assert.equal(
    status(loan({ content: "Rates from 9.99% APR up to 29.99% APR." }), "offer-match"),
    "finding",
  );
  // A starting rate that is inside the range but not the offer minimum misstates the offer.
  assert.equal(status(loan({ content: "Rates as low as 12.99% APR." }), "offer-match"), "finding");
  // A loan amount next to a single APR is not a range bound; which borrowers get 14.99% is unknowable.
  assert.equal(
    status(loan({ content: "Borrow up to $40,000 at 14.99% APR." }), "offer-match"),
    "unknown",
  );
  // Interest-rate wording is not an APR; do not guess.
  assert.equal(
    status(loan({ content: "Rates as low as 9.99% for qualified borrowers." }), "offer-match"),
    "unknown",
  );

  const noOffer = check(
    analyze(loan({ offerId: null, content: "From 8.99% APR." })),
    "offer-match",
  );
  assert.equal(noOffer.status, "unknown");
  assert.equal(noOffer.excerpt, undefined);
  assert.equal(
    status(loan({ offerId: "missing-offer", content: "From 8.99% APR." }), "offer-match"),
    "unknown",
  );
  assert.equal(
    status(loan({ offerId: "everyday-card", content: "From 8.99% APR." }), "offer-match"),
    "unknown",
  );
  assert.equal(
    status(
      loan({ productId: "unknown", offerId: null, content: "From 8.99% APR." }),
      "offer-match",
    ),
    "unknown",
  );
});

Deno.test("unrelated company age and account-review cadence are not repayment periods", () => {
  for (
    const content of [
      "ClearPath has served customers for 10 years. Rates from 9.99% APR. Monthly payments available.",
      "Get a free account review every 12 months. Rates from 9.99% APR. Monthly payments available.",
      "Our personal loan team has served customers for 10 years.",
    ]
  ) {
    assert.equal(status(loan({ content }), "loan-repayment"), "passed", content);
  }
});

Deno.test("repayment periods retain their exact evidence when unrelated durations are present", () => {
  for (
    const [content, quote] of [
      ["We have served customers for 10 years. Repay over 3 years.", "3 years"],
      ["Get a free account review every 12 months. Choose a 60-month term.", "60-month"],
      ["Borrow with a repayment term of 3 years.", "3 years"],
      ["Choose a 36-month personal loan.", "36-month"],
      ["Pay it back over 5 years.", "5 years"],
    ]
  ) {
    const input = loan({ content });
    const result = check(analyze(input), "loan-repayment");
    assert.equal(result.status, "finding", content);
    assertExactExcerpt(input, result, quote);
  }
});

Deno.test("mortgage rates cannot be verified against a catalog with no rates", () => {
  const result = check(
    analyze(home({ content: "HomeStart mortgages from 6.25% APR." })),
    "offer-match",
  );
  assert.equal(result.status, "unknown");
  assert.match(result.explanation, /no mortgage rate|does not supply|cannot verify/i);
});

Deno.test("approval claims request human judgment; negations and prequalification language do not", () => {
  const claim = home({ content: "Good news! You're already approved for a HomeStart mortgage." });
  const result = check(analyze(claim), "approval-claims");
  assert.equal(result.status, "finding");
  assert.equal(result.kind, "human_judgment");
  assert.equal(result.reference.type, "company_policy");
  assertExactExcerpt(claim, result, "You're already approved");

  assert.equal(
    status(
      card({ content: "Guaranteed approval on the Everyday Credit Card." }),
      "approval-claims",
    ),
    "finding",
  );
  assert.equal(
    status(loan({ content: "You are pre-approved for up to $25,000." }), "approval-claims"),
    "finding",
  );
  assert.equal(
    status(loan({ content: "Approval is guaranteed for every applicant." }), "approval-claims"),
    "finding",
  );

  for (
    const content of [
      homeCopy,
      "Check whether you may prequalify in minutes.",
      "Approval is not guaranteed. Subject to credit approval.",
      "You are not pre-approved; this is an invitation to apply.",
      "No guaranteed approval. Final approval is subject to underwriting.",
    ]
  ) assert.equal(status(home({ content }), "approval-claims"), "passed", content);

  const substantiated = check(
    analyze(home({ ...claim, substantiation: "Applicant list from underwriting batch 42." })),
    "approval-claims",
  );
  assert.equal(substantiated.status, "finding");
  assert.match(substantiated.explanation, /substantiation/i);
});

Deno.test("approval questions and invitations are uncertain rather than affirmative assertions", () => {
  for (
    const content of [
      "See if you are pre-approved for a ClearPath mortgage.",
      "See if you're pre-approved for a ClearPath mortgage.",
      "Check whether you've been approved for a ClearPath mortgage.",
      "Are you pre-approved? Explore your options with ClearPath.",
      "Is approval guaranteed? Explore your options with ClearPath.",
    ]
  ) {
    const result = check(analyze(home({ content })), "approval-claims");
    assert.equal(result.status, "unknown", content);
    assert.equal(result.kind, "missing_information");
    assert.doesNotMatch(result.explanation, /asserts guaranteed or existing approval/i);
  }
});

Deno.test("an approval question or invitation cannot hide a separate affirmative claim", () => {
  for (
    const [content, quote] of [
      [
        "See if you are pre-approved. You're already approved for this offer.",
        "You're already approved",
      ],
      ["Are you pre-approved? Guaranteed approval on your loan.", "Guaranteed approval"],
      ["Don't wait — you're pre-approved for this offer.", "pre-approved"],
      ["See if you qualify, approval is guaranteed for every applicant.", "approval is guaranteed"],
    ]
  ) {
    const input = home({ content });
    const result = check(analyze(input), "approval-claims");
    assert.equal(result.status, "finding", content);
    assertExactExcerpt(input, result, quote);
  }
});

Deno.test("review context: launch dates are inclusive, future launches are allowed, out-of-window launches are findings", () => {
  assert.equal(status(card({ launchDate: "2026-01-01" }), "review-context"), "passed");
  assert.equal(status(card({ launchDate: "2027-12-31" }), "review-context"), "passed");
  assert.equal(status(card({ launchDate: "2027-06-15" }), "review-context"), "passed");

  const early = check(analyze(card({ launchDate: "2025-12-31" })), "review-context");
  assert.equal(early.status, "finding");
  assert.match(early.explanation, /2026-01-01/);
  const late = check(analyze(card({ launchDate: "2028-01-01" })), "review-context");
  assert.equal(late.status, "finding");
  assert.match(late.explanation, /2027-12-31/);
});

Deno.test("incomplete or unknown context yields unknown, never a clean pass", () => {
  const partial = analyze(card({ content: "0% intro APR on purchases.", completeAsset: false }));
  assert.equal(check(partial, "review-context").status, "unknown");
  assert.equal(check(partial, "review-context").kind, "missing_information");
  assert.equal(check(partial, "card-promo-terms").status, "unknown");

  const partialLoan = analyze(loan({ content: "Rates from 9.99% APR.", completeAsset: false }));
  assert.equal(check(partialLoan, "loan-repayment").status, "unknown");
  assert.equal(check(partialLoan, "approval-claims").status, "unknown");

  assert.equal(status(card({ format: "unknown" }), "review-context"), "unknown");
  assert.equal(
    status(card({ format: "unknown", content: "0% intro APR on purchases." }), "card-promo-terms"),
    "unknown",
  );
  assert.equal(status(card({ offerId: null }), "review-context"), "unknown");
  assert.equal(status(card({ offerId: "flex-personal" }), "review-context"), "unknown");

  const unknownProduct = analyze(
    card({
      productId: "unknown",
      offerId: null,
      content: "0% APR for 12 months. 36 monthly payments.",
    }),
  );
  for (
    const id of [
      "review-context",
      "offer-match",
      "card-intro-label",
      "card-promo-terms",
      "loan-repayment",
    ]
  ) {
    assert.equal(check(unknownProduct, id).status, "unknown", id);
  }
  // The fictional approval policy applies to every product, so it is the only check that can run.
  assert.ok(
    unknownProduct.checks.every((result) =>
      result.status !== "passed" || result.ruleId === "approval-claims"
    ),
  );
});

Deno.test("every offer in the catalog clears its own approved copy", () => {
  for (const offer of offers) {
    const analysis = analyze(
      card({ productId: offer.productId, offerId: offer.id, content: offer.approvedCopy }),
    );
    assert.ok(
      analysis.checks.every((result) =>
        result.status === "passed" || result.status === "not_applicable"
      ),
      offer.id,
    );
  }
});
