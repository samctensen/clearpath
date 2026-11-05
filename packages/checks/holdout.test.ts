import type { Analysis, CheckResult, SubmissionInput } from "../contracts/mod.ts";
import { offers } from "./catalog.ts";
import { analyze } from "./engine.ts";

// These scenarios were established from the original build specification, contracts, and the offer
// catalog before reading the engine or its tests. Keep them behavior-focused.
const ruleIds = [
  "review-context", "offer-match", "card-intro-label", "card-promo-terms",
  "loan-repayment", "approval-claims",
];

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function input(overrides: Partial<SubmissionInput> = {}): SubmissionInput {
  return {
    title: "Independent copy review", productId: "card", offerId: "everyday-card",
    content: offers[0].approvedCopy, format: "landing_page", publisher: "ClearPath",
    launchDate: "2027-04-01", completeAsset: true, linksToApplication: null,
    substantiation: "", ...overrides,
  };
}

function run(value: SubmissionInput): Analysis {
  const result = analyze(value);
  assert(result.checks.length === ruleIds.length, "Every analysis must run exactly six checks");
  assert(new Set(result.checks.map((check) => check.ruleId)).size === ruleIds.length,
    "Checks must have unique rule IDs");
  for (const id of ruleIds) assert(result.checks.some((check) => check.ruleId === id), `Missing ${id}`);
  assert(/text/i.test(result.scope), "Scope must explicitly identify text analysis");
  assert(result.policyVersion.length > 0, "Analysis must identify the policy version");
  for (const check of result.checks) {
    if (!check.excerpt) continue;
    const { start, end, text } = check.excerpt;
    assert(Number.isInteger(start) && Number.isInteger(end), `${check.ruleId}: integer excerpt offsets`);
    assert(start >= 0 && end > start && end <= value.content.length,
      `${check.ruleId}: excerpt must be nonempty and within the submitted content`);
    assert(value.content.slice(start, end) === text,
      `${check.ruleId}: exact excerpt text must match its original offsets`);
  }
  return result;
}

function check(result: Analysis, id: string): CheckResult {
  const found = result.checks.find((item) => item.ruleId === id);
  assert(found, `Missing ${id}`);
  return found;
}

type Expectations = Record<string, CheckResult["status"] | CheckResult["status"][]>;
function scenario(name: string, overrides: Partial<SubmissionInput>, expected: Expectations,
  options: { presence?: string[]; absence?: string[] } = {}) {
  Deno.test(`holdout: ${name}`, () => {
    const value = input(overrides);
    const result = run(value);
    for (const [id, status] of Object.entries(expected)) {
      const actual = check(result, id);
      assert(Array.isArray(status) ? status.includes(actual.status) : actual.status === status,
        `${id}: expected ${status}, got ${actual.status}. ${actual.explanation}`);
    }
    for (const id of options.presence ?? []) {
      assert(check(result, id).excerpt, `${id}: presence concern must cite the triggering copy`);
    }
    for (const id of options.absence ?? []) {
      assert(!check(result, id).excerpt, `${id}: absence concern must not fabricate an excerpt`);
    }
  });
}

for (const offer of offers) {
  scenario(`${offer.productId} catalog copy clears applicable checks`, {
    productId: offer.productId, offerId: offer.id, content: offer.approvedCopy,
  }, {
    "review-context": "passed", "offer-match": "passed", "approval-claims": "passed",
    ...(offer.productId === "card" ? {
      "card-intro-label": "passed" as const, "card-promo-terms": "passed" as const,
      "loan-repayment": "not_applicable" as const,
    } : {
      "card-intro-label": "not_applicable" as const,
      "card-promo-terms": "not_applicable" as const,
      "loan-repayment": offer.productId === "personal_loan" ? "passed" as const : "not_applicable" as const,
    }),
  });
}

scenario("future launch inside the offer window is available", { launchDate: "2027-12-31" },
  { "review-context": "passed" });
scenario("launch before offer availability needs context", { launchDate: "2025-12-31" },
  { "review-context": ["unknown", "finding"] }, { absence: ["review-context"] });
scenario("launch after offer availability needs context", { launchDate: "2028-01-01" },
  { "review-context": ["unknown", "finding"] });
scenario("unknown offer cannot produce an offer mismatch", { offerId: "not-in-catalog", content: "0% intro APR for 18 months, then 29.99% APR." },
  { "review-context": "unknown", "offer-match": "unknown" });
scenario("offer from a different product is not valid context", { offerId: "flex-personal" },
  { "review-context": "unknown", "offer-match": "unknown" });
scenario("incomplete copy cannot clear missing promotion disclosure", { completeAsset: false, content: "0% intro APR on purchases." },
  { "review-context": "unknown", "card-promo-terms": "unknown" });
scenario("unknown format cannot clear the promotion disclosure", { format: "unknown", content: "0% intro APR on purchases." },
  { "review-context": "unknown", "card-promo-terms": "unknown" });
scenario("unknown product leaves product-specific rules unresolved", {
  productId: "unknown", offerId: null, format: "unknown", completeAsset: false,
  content: "Discover ClearPath products and learn more.",
}, { "review-context": "unknown", "offer-match": "unknown", "card-intro-label": "unknown",
  "card-promo-terms": "unknown", "loan-repayment": "unknown" });

scenario("short standalone intro claim needs promo terms", { content: "0% intro APR on purchases." },
  { "offer-match": "passed", "card-intro-label": "passed", "card-promo-terms": "finding" },
  { absence: ["card-promo-terms"] });
scenario("complete new card copy clears checks", {
  content: "Your purchase APR is 0% introductory for 12 months. After that, the ongoing APR is 19.99%.",
}, { "offer-match": "passed", "card-intro-label": "passed", "card-promo-terms": "passed" });
scenario("card intro and ongoing rates must not be swapped", {
  content: "19.99% intro APR on purchases for 12 months, then 0% APR.",
}, { "offer-match": "finding" }, { presence: ["offer-match"] });
scenario("card rate roles survive reversed sentence order", {
  content: "The ongoing APR is 19.99%. The introductory APR is 0% for 12 months.",
}, { "offer-match": "passed", "card-intro-label": "passed", "card-promo-terms": "passed" });
scenario("card ongoing mismatch when APR precedes its value", {
  content: "Introductory APR is 0% for 12 months. After that, the ongoing APR is 29.99%.",
}, { "offer-match": "finding" }, { presence: ["offer-match"] });
scenario("changed promotional duration is a live mismatch", {
  content: "0% introductory APR for 18 months, then 19.99% APR.",
}, { "offer-match": "finding" }, { presence: ["offer-match"] });
scenario("introductory zero rate needs an introductory label", {
  content: "0% APR on purchases for 12 months, then 19.99% APR.",
}, { "card-intro-label": "finding" });
scenario("unassigned multiple card APRs are ambiguous", {
  content: "Compare the card's rates: 0% APR and 19.99% APR.",
}, { "offer-match": "unknown" });
scenario("unrelated reward percentage does not mismatch APR", {
  content: "Earn 3% cash back. 0% intro APR for 12 months, then 19.99% APR.",
}, { "offer-match": "passed" });
scenario("a reward duration does not supply the promotional duration", {
  content: "0% intro APR on purchases, then 19.99% APR. Earn bonus rewards for 12 months.",
}, { "card-promo-terms": "finding" }, { absence: ["card-promo-terms"] });
scenario("promo duration alone does not supply ongoing APR", {
  content: "0% intro APR for 12 months. Earn 19.99% bonus rewards.",
}, { "card-promo-terms": "finding" }, { absence: ["card-promo-terms"] });
scenario("a banner linked to an application skips only promo terms", {
  format: "banner", linksToApplication: true, content: "0% APR for 18 months. Guaranteed approval.",
}, { "card-promo-terms": "not_applicable", "card-intro-label": "finding",
  "offer-match": "finding", "approval-claims": "finding" });
scenario("a banner with unknown destination leaves promo rule unknown", {
  format: "banner", linksToApplication: null, content: "0% intro APR on purchases.",
}, { "card-promo-terms": "unknown" });
scenario("a banner not linked to an application needs promo terms", {
  format: "banner", linksToApplication: false, content: "0% intro APR on purchases.",
}, { "card-promo-terms": "finding" }, { absence: ["card-promo-terms"] });
scenario("a landing page does not gain the banner exception", {
  format: "landing_page", linksToApplication: true, content: "0% intro APR on purchases.",
}, { "card-promo-terms": "finding" });

const loan: Partial<SubmissionInput> = { productId: "personal_loan", offerId: "flex-personal" };
scenario("loan APR plus generic monthly payments is not a repayment trigger", {
  ...loan, content: "From 9.99% APR. Monthly payments available.",
}, { "offer-match": "passed", "loan-repayment": "passed" });
scenario("specific monthly payment count requests human disclosure review", {
  ...loan, content: "From 9.99% APR. Repay in 36 monthly payments.",
}, { "loan-repayment": "finding" }, { presence: ["loan-repayment"] });
scenario("specific repayment period requests human disclosure review", {
  ...loan, content: "Borrow with a repayment term of 3 years. Rates from 9.99% APR.",
}, { "loan-repayment": "finding" }, { presence: ["loan-repayment"] });
scenario("specific monthly payment amount requests human disclosure review", {
  ...loan, content: "Pay $250 per month on your ClearPath personal loan.",
}, { "loan-repayment": "finding" }, { presence: ["loan-repayment"] });
scenario("a loan amount alone is not a payment amount", {
  ...loan, content: "Borrow $5,000. Flexible monthly payments available.",
}, { "loan-repayment": "passed" });
scenario("loan minimum below catalog is a mismatch", {
  ...loan, content: "From 8.99% APR. Subject to credit approval.",
}, { "offer-match": "finding" }, { presence: ["offer-match"] });
scenario("loan minimum is directional, not any value inside the range", {
  ...loan, content: "Rates from 24.99% APR. Subject to credit approval.",
}, { "offer-match": "finding" }, { presence: ["offer-match"] });
scenario("loan maximum is directional", {
  ...loan, content: "Rates up to 9.99% APR. Subject to credit approval.",
}, { "offer-match": "finding" }, { presence: ["offer-match"] });
scenario("loan range with trailing APR is recognized", {
  ...loan, content: "Rates range from 9.99% to 24.99% APR. Subject to credit approval.",
}, { "offer-match": "passed" });
scenario("loan range with trailing APR checks the first endpoint", {
  ...loan, content: "Rates range from 8.99% to 24.99% APR. Subject to credit approval.",
}, { "offer-match": "finding" }, { presence: ["offer-match"] });
scenario("loan APR preceding the number is compared", {
  ...loan, content: "Our minimum APR is 8.99%. Subject to credit approval.",
}, { "offer-match": "finding" }, { presence: ["offer-match"] });
scenario("mortgage APR cannot be verified from the fixture", {
  productId: "mortgage", offerId: "home-start", content: "Explore home loans with 6.25% APR.",
}, { "offer-match": "unknown" });

for (const content of [
  "Approval is not guaranteed. Review your options today.",
  "You are not pre-approved. Check whether you may prequalify.",
  "You are not already approved. Final approval requires underwriting.",
  "We cannot guarantee approval. Explore your options today.",
  "Check whether you may prequalify for a ClearPath mortgage.",
]) {
  scenario(`ordinary qualified or negated approval copy: ${content}`, {
    productId: "mortgage", offerId: "home-start", content,
  }, { "approval-claims": "passed" });
}
for (const content of [
  "You're already approved for a ClearPath mortgage.",
  "You are pre-approved for a ClearPath mortgage.",
  "Guaranteed approval on your ClearPath personal loan.",
]) {
  scenario(`positive approval assertion: ${content}`, { content },
    { "approval-claims": "finding" }, { presence: ["approval-claims"] });
}
scenario("substantiation does not automatically clear approval assertions", {
  content: "You are already approved for a ClearPath card.",
  substantiation: "A reviewer supplied a campaign eligibility spreadsheet.",
}, { "approval-claims": "finding" }, { presence: ["approval-claims"] });
scenario("a negated first claim cannot hide a later positive claim", {
  content: "Approval is not guaranteed. You are already approved for this offer.",
}, { "approval-claims": "finding" }, { presence: ["approval-claims"] });
scenario("unicode prefix preserves exact finding offsets", {
  content: "🏡 A clearer path—now available. You're already approved for HomeStart.",
  productId: "mortgage", offerId: "home-start",
}, { "approval-claims": "finding" }, { presence: ["approval-claims"] });

// Supplemental independent controls added after the implementation owner disclosed
// possible false flags in invitations and unrelated durations. The original 49
// holdouts above were established before any implementation findings were shared.
scenario("an invitation to check preapproval does not assert it", {
  productId: "mortgage", offerId: "home-start",
  content: "See if you are pre-approved for a ClearPath mortgage.",
}, { "approval-claims": ["passed", "unknown"] });
scenario("a direct preapproval question does not assert an approval", {
  productId: "mortgage", offerId: "home-start",
  content: "Are you pre-approved? Explore your options with ClearPath.",
}, { "approval-claims": ["passed", "unknown"] });
scenario("company age is not a loan repayment period", {
  ...loan,
  content: "ClearPath has served customers for 10 years. Rates from 9.99% APR. Monthly payments available.",
}, { "loan-repayment": "passed" });
scenario("annual account-review cadence is not a loan repayment period", {
  ...loan,
  content: "Get a free account review every 12 months. Rates from 9.99% APR. Monthly payments available.",
}, { "loan-repayment": "passed" });
