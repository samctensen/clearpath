import type { CaseSummary } from "./mod.ts";

export type SubmitterView = "all" | "needs_attention" | "awaiting_review" | "approved";
export interface SubmissionGuidance {
  kind: "reviewer_feedback" | "missing_information" | "awaiting_review" | "approved_copy";
  revision: number;
  text: string;
  recordedAt: string;
}
export interface DashboardRow extends CaseSummary {
  guidance: SubmissionGuidance | null;
}
