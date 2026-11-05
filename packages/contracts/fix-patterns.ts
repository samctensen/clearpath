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
    description: `An automated check couldn’t evaluate ${label.toLowerCase()} on the current revision. This isn’t a confirmed error; the submission shows what context is missing.`,
    source: "missing_information" as const,
  })),
  ...rules.map(([id, label]) => ({
    id: `request:${id}`, label,
    description: `A reviewer asked for a correction to ${label.toLowerCase()} on the current revision. The request is recorded on the submission.`,
    source: "reviewer_request" as const,
  })),
  {
    id: "other_feedback", label: "Reviewer notes",
    description: "Reviewer requests that aren’t tied to a specific check, including manual concerns and older feedback that was never classified.",
    source: "reviewer_request",
  },
  {
    id: "details_unavailable", label: "Details unavailable",
    description: "These submissions need attention, but the current reason is missing or can’t be classified reliably. Open one to see what’s recorded.",
    source: "unavailable",
  },
];

const reasonIds = new Set(fixReasonDefinitions.map((reason) => reason.id));
export function isFixReasonId(value: unknown): value is string {
  return typeof value === "string" && reasonIds.has(value);
}
