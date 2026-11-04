import type { Analysis, Offer, ProductId, SubmissionInput } from "@clearpath/contracts";
import type { SeedPlan } from "@clearpath/models";

/**
 * The fictional campaigns a fresh demo workspace starts with.
 *
 * The set is deliberately wider than one case per offer: the queue pages, the
 * status filters, the product filters and the launch-date sort all need more
 * than a handful of rows before they show anything. A sample that names a
 * catalog offer is seeded only when the server actually serves that offer, so
 * a narrower catalog yields a correspondingly smaller workspace.
 */
type SeedSample = {
  title: string;
  /** Catalog offer the copy promotes; null leaves the submission unmatched. */
  offerId: string | null;
  /** Defaults to the selected offer's product. */
  productId?: ProductId;
  /** Defaults to the selected offer's approved copy. */
  content?: string;
  format: SubmissionInput["format"];
  publisher: string;
  launchDate: string;
  completeAsset?: boolean;
  linksToApplication?: boolean | null;
  substantiation?: string;
  review?: SeedReview;
};
/**
 * A decision to record against revision 1. Dispositions are resolved against
 * the analysis the engine actually produces, so a rule that stops firing never
 * turns into an invalid seed.
 */
type SeedReview = {
  decision: "approve" | "request_changes";
  note: string;
  /** Rules to confirm by hand; the rest of the concerns stay open. */
  confirm?: string[];
};

const samples: SeedSample[] = [
  // --- The six cases the README walkthrough depends on ---------------------
  {
    title: "Everyday Credit Card — campaign page",
    offerId: "everyday-card",
    format: "landing_page",
    publisher: "ClearPath Studio",
    launchDate: "2026-11-15",
  },
  {
    title: "Everyday Credit Card — partner email",
    offerId: "everyday-card",
    content: "0% intro APR on purchases. Apply today.",
    format: "email",
    publisher: "Northstar Media",
    launchDate: "2026-11-15",
    review: { decision: "request_changes", note: "Please add the promotional terms." },
  },
  {
    title: "Flex Personal Loan — campaign page",
    offerId: "flex-personal",
    format: "landing_page",
    publisher: "ClearPath Studio",
    launchDate: "2026-11-15",
  },
  {
    title: "Flex Personal Loan — partner email",
    offerId: "flex-personal",
    format: "email",
    publisher: "Northstar Media",
    launchDate: "2026-11-15",
    completeAsset: false,
  },
  {
    title: "HomeStart Prequalification — campaign page",
    offerId: "home-start",
    format: "landing_page",
    publisher: "ClearPath Studio",
    launchDate: "2026-11-15",
    review: { decision: "approve", note: "Approved for this demo." },
  },
  {
    title: "HomeStart Prequalification — partner email",
    offerId: "home-start",
    format: "email",
    publisher: "Northstar Media",
    launchDate: "2026-11-15",
  },

  // --- Everyday Credit Card ------------------------------------------------
  {
    title: "Everyday Credit Card — rewards banner",
    offerId: "everyday-card",
    content:
      "0% intro APR on purchases for 12 months from account opening, then 19.99% APR. No annual fee. Subject to credit approval.",
    format: "banner",
    publisher: "Beacon Display Network",
    launchDate: "2026-12-01",
    linksToApplication: true,
  },
  {
    title: "Everyday Credit Card — social teaser",
    offerId: "everyday-card",
    content:
      "Say hello to the ClearPath Everyday Credit Card. 0% APR on purchases for 12 months from account opening, then 19.99% APR. No annual fee. Subject to credit approval.",
    format: "social",
    publisher: "ClearPath Social",
    launchDate: "2026-11-20",
    linksToApplication: false,
  },
  {
    title: "Everyday Credit Card — welcome series email",
    offerId: "everyday-card",
    content:
      "Your card is on its way. Enjoy 0% intro APR on purchases for 18 months from account opening, then 19.99% APR. No annual fee. Subject to credit approval.",
    format: "email",
    publisher: "Northstar Media",
    launchDate: "2026-11-10",
    review: {
      decision: "request_changes",
      note: "The approved offer runs 12 months. Match the catalog before the next send.",
      confirm: ["offer-match"],
    },
  },
  {
    title: "Everyday Credit Card — affiliate excerpt",
    offerId: "everyday-card",
    content: "0% intro APR on purchases. See the partner site for full details.",
    format: "unknown",
    publisher: "Partner Studio",
    launchDate: "2026-12-10",
    completeAsset: false,
  },

  // --- Flex Personal Loan --------------------------------------------------
  {
    title: "Flex Personal Loan — rate table page",
    offerId: "flex-personal",
    format: "landing_page",
    publisher: "ClearPath Studio",
    launchDate: "2026-11-12",
    review: {
      decision: "approve",
      note: "Rates match the fictional Flex Personal Loan snapshot.",
    },
  },
  {
    title: "Flex Personal Loan — repayment email",
    offerId: "flex-personal",
    content:
      "Make room for your next chapter with a ClearPath Flex Personal Loan. Rates from 9.99% APR to 24.99% APR. Repay your loan in 36 monthly payments. Subject to credit approval.",
    format: "email",
    publisher: "Northstar Media",
    launchDate: "2026-11-08",
    review: {
      decision: "request_changes",
      note: "Send the full repayment disclosures with the next revision.",
      confirm: ["loan-repayment"],
    },
  },
  {
    title: "Flex Personal Loan — consolidation social",
    offerId: "flex-personal",
    content:
      "Consolidate what you owe with a ClearPath Flex Personal Loan. Rates from 9.99% APR to 24.99% APR. You're already approved.",
    format: "social",
    publisher: "ClearPath Social",
    launchDate: "2026-11-25",
  },
  {
    title: "Flex Personal Loan — retargeting banner",
    offerId: "flex-personal",
    format: "banner",
    publisher: "Beacon Display Network",
    launchDate: "2027-01-15",
    linksToApplication: true,
  },

  // --- HomeStart Prequalification -----------------------------------------
  {
    title: "HomeStart Prequalification — buyer guide page",
    offerId: "home-start",
    format: "landing_page",
    publisher: "ClearPath Studio",
    launchDate: "2026-11-18",
  },
  {
    title: "HomeStart Prequalification — preapproval social",
    offerId: "home-start",
    content:
      "Good news from ClearPath HomeStart: you're pre-approved for your mortgage. Start your move today.",
    format: "social",
    publisher: "ClearPath Social",
    launchDate: "2026-11-05",
    substantiation: "Campaign brief claims an internal eligibility score; no underwriting file.",
    review: {
      decision: "request_changes",
      note: "Replace the approval claim with prequalification language.",
      confirm: ["approval-claims"],
    },
  },
  {
    title: "HomeStart Prequalification — agent co-marketing email",
    offerId: "home-start",
    format: "email",
    publisher: "Harbor Realty Group",
    launchDate: "2028-03-01",
  },

  // --- Not yet tied to an offer -------------------------------------------
  {
    title: "Spring campaign teaser — product undecided",
    offerId: null,
    productId: "unknown",
    content:
      "A clearer path to your next move. Something new from ClearPath is coming this spring.",
    format: "unknown",
    publisher: "ClearPath Studio",
    launchDate: "2027-02-01",
    completeAsset: false,
  },
];

const toInput = (sample: SeedSample, offer: Offer | undefined): SubmissionInput => ({
  title: sample.title,
  productId: sample.productId ?? offer?.productId ?? "unknown",
  offerId: sample.offerId,
  content: sample.content ?? offer?.approvedCopy ?? "",
  format: sample.format,
  publisher: sample.publisher,
  launchDate: sample.launchDate,
  completeAsset: sample.completeAsset ?? true,
  linksToApplication: sample.linksToApplication ?? null,
  substantiation: sample.substantiation ?? "",
});

const dispositionsFor = (review: SeedReview, analysis: Analysis) => {
  const concerns = analysis.checks.filter((c) => c.status === "finding" || c.status === "unknown");
  if (review.decision === "approve") {
    return concerns.map((check) => ({
      ruleId: check.ruleId,
      action: "dismissed" as const,
      reason: "Reviewed for this fictional example.",
    }));
  }
  const confirm = new Set(review.confirm ?? []);
  return concerns.filter((check) => confirm.has(check.ruleId)).map((check) => ({
    ruleId: check.ruleId,
    action: "confirmed" as const,
    reason: review.note,
  }));
};

/**
 * Beyond the curated samples the queue needs volume: paging, the status and
 * product filters, the cohort chart and the launch-date sort all behave
 * differently against a real backlog than against a handful of rows. These
 * are generated rather than written out so the set can be resized without
 * hand-maintaining hundreds of literals.
 *
 * Generation is deterministic — index arithmetic, no randomness — so the same
 * count always yields the same workspace and tests stay stable.
 */
export const DEFAULT_SEED_CASES = 50;

const campaigns = [
  "brand refresh",
  "always-on acquisition",
  "seasonal push",
  "lifecycle nurture",
  "partner co-marketing",
  "winback",
  "referral drive",
  "awareness burst",
  "comparison placement",
  "retargeting flight",
  "newsletter sponsorship",
  "launch teaser",
];
const publishers = [
  "ClearPath Studio",
  "Northstar Media",
  "Beacon Display Network",
  "ClearPath Social",
  "Harbor Realty Group",
  "Partner Studio",
  "Meridian Affiliates",
  "Lakeside Publishing",
];
const formats: SubmissionInput["format"][] = ["landing_page", "email", "banner", "social"];

/** Copy variants per product, each chosen to land on a known check outcome. */
const variants: Record<string, ((offer: Offer) => string)[]> = {
  card: [
    (offer) => offer.approvedCopy,
    () => "0% APR on purchases for 12 months from account opening, then 19.99% APR. No annual fee.",
    () => "Enjoy 0% intro APR on purchases for 18 months from account opening, then 19.99% APR.",
    () => "0% intro APR on purchases. Apply today.",
  ],
  personal_loan: [
    (offer) => offer.approvedCopy,
    (offer) => `${offer.approvedCopy} Repay your loan in 36 monthly payments.`,
    (offer) => `${offer.approvedCopy} You're already approved.`,
    (offer) => offer.approvedCopy,
  ],
  mortgage: [
    (offer) => offer.approvedCopy,
    () => "Good news from ClearPath HomeStart: you're pre-approved for your mortgage.",
    (offer) => offer.approvedCopy,
    (offer) => offer.approvedCopy,
  ],
};

const addDays = (start: string, days: number) =>
  new Date(Date.parse(start) + days * 86_400_000).toISOString().slice(0, 10);

/**
 * One generated campaign. `index` drives every axis through coprime strides,
 * so products, formats, publishers and outcomes stay mixed rather than
 * marching in step.
 */
function generated(index: number, catalog: Offer[]): SeedSample {
  const offer = catalog[index % catalog.length];
  const campaign = campaigns[(index * 5) % campaigns.length];
  const format = formats[(index * 3) % formats.length];
  const publisher = publishers[(index * 7) % publishers.length];
  const variant = variants[offer.productId][index % 4];
  // Excerpts stand in for the partial assets a reviewer genuinely receives.
  const excerpt = index % 11 === 0;
  const outcome = index % 4;
  const review: SeedReview | undefined = excerpt ? undefined : outcome === 1
    ? {
      decision: "request_changes",
      note: "Align the copy with the approved offer before the next flight.",
      confirm: ["offer-match", "card-promo-terms", "loan-repayment", "approval-claims"],
    }
    : outcome === 2
    ? { decision: "approve", note: "Reviewed against the fictional catalog snapshot." }
    : undefined;
  return {
    title: `${offer.name} — ${campaign} ${String(index + 1).padStart(3, "0")}`,
    offerId: offer.id,
    content: variant(offer),
    format,
    publisher,
    // Spread across roughly a year, so the launch-date sort and the overdue
    // count both have a real distribution to work with.
    launchDate: addDays("2026-10-01", (index * 13) % 400),
    completeAsset: !excerpt,
    linksToApplication: format === "banner" ? index % 2 === 0 : null,
    review,
  };
}

/** Builds the seed plans for the offers this server actually serves. */
export function buildSeedPlans(
  offers: Offer[],
  analyze: (input: SubmissionInput) => Analysis,
  caseCount: number = DEFAULT_SEED_CASES,
): SeedPlan[] {
  // An empty catalog supports no fictional campaign, so the workspace stays empty.
  if (offers.length === 0) return [];
  const catalog = new Map(offers.map((offer) => [offer.id, offer]));
  const extra = Math.max(0, caseCount - samples.length);
  const all = [
    ...samples,
    ...Array.from({ length: extra }, (_, index) => generated(index, offers)),
  ];
  return all.flatMap((sample) => {
    const offer = sample.offerId === null ? undefined : catalog.get(sample.offerId);
    // A sample that names an offer this catalog does not carry is not seeded.
    if (sample.offerId !== null && !offer) return [];
    const input = toInput(sample, offer);
    const analysis = analyze(input);
    const review = sample.review;
    if (!review) return [{ input, analysis }];
    return [{
      input,
      analysis,
      decision: {
        decision: review.decision,
        note: review.note,
        dispositions: dispositionsFor(review, analysis),
      },
    }];
  });
}
