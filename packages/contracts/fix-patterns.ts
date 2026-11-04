export type FixPatternSource = "missing_information" | "reviewer_request" | "unavailable";

export interface FixPattern {
  id: string;
  label: string;
  description: string;
  source: FixPatternSource;
  count: number;
}

export interface FixPatternSummary {
  /** Distinct attention submissions; a submission can appear in multiple reasons. */
  total: number;
  reasons: FixPattern[];
}

const rules = [
  ["review-context", "Submission details"],
  ["offer-match", "Offer terms"],
  ["card-intro-label", "Introductory rate label"],
  ["card-promo-terms", "Promotional terms"],
  ["loan-repayment", "Loan repayment details"],
  ["approval-claims", "Approval claims"],
] as const;

/** Stable order breaks count ties; labels never come from unclassified legacy prose. */
export const fixReasonDefinitions: readonly Omit<FixPattern, "count">[] = [
  ...rules.map(([id, label]) => ({
    id: `missing:${id}`, label,
    description: `A current automated check needs more information about ${label.toLowerCase()}. Open the submission to review the recorded gap.`,
    source: "missing_information" as const,
  })),
  ...rules.map(([id, label]) => ({
    id: `request:${id}`, label,
    description: `A reviewer requested a correction to ${label.toLowerCase()} on the current revision. Open the submission for the recorded request.`,
    source: "reviewer_request" as const,
  })),
  {
    id: "other_feedback", label: "Other reviewer feedback",
    description: "The current request contains a reviewer note, manual concern, or older feedback without a classified check. Open the submission to read it.",
    source: "reviewer_request",
  },
  {
    id: "details_unavailable", label: "Details unavailable",
    description: "This submission needs attention, but its current reason is missing or cannot be classified reliably. Open the submission to inspect the available details.",
    source: "unavailable",
  },
];

const reasonIds = new Set(fixReasonDefinitions.map((reason) => reason.id));
export function isFixReasonId(value: unknown): value is string {
  return typeof value === "string" && reasonIds.has(value);
}
