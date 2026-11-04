import { z } from "zod";
export * from "./ai-review.ts";

export const productIds = ["card", "personal_loan", "mortgage", "unknown"] as const;
export type ProductId = typeof productIds[number];
export const assetFormats = ["landing_page", "email", "banner", "social", "unknown"] as const;
export type AssetFormat = typeof assetFormats[number];
export type DemoRole = "reviewer" | "submitter";
export type CaseStatus = "needs_information" | "ready_for_review" | "changes_requested" | "approved";
export const submissionSchema = z.object({
  title: z.string().trim().min(3).max(160),
  productId: z.enum(productIds),
  offerId: z.string().max(100).nullable(),
  content: z.string().trim().min(10).max(20000),
  format: z.enum(assetFormats),
  publisher: z.string().trim().min(2).max(100),
  launchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((v) => Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Use a valid date"),
  completeAsset: z.boolean(),
  linksToApplication: z.boolean().nullable(),
  substantiation: z.string().max(4000).default(""),
});
export type SubmissionInput = z.infer<typeof submissionSchema>;
export interface Offer {
  id: string;
  productId: Exclude<ProductId, "unknown">;
  name: string;
  version: string;
  description: string;
  terms: { aprMin?: number; aprMax?: number; introApr?: number; introMonths?: number; ongoingApr?: number; annualFee?: number; minMonths?: number; maxMonths?: number };
  availableFrom: string;
  availableUntil: string;
  approvedCopy: string;
  notes: string[];
}
export type CheckStatus = "passed" | "finding" | "unknown" | "not_applicable";
export interface CheckResult {
  ruleId: string;
  title: string;
  status: CheckStatus;
  severity: "high" | "medium" | "info";
  kind: "mismatch" | "missing_information" | "human_judgment" | "disclosure" | "context";
  explanation: string;
  excerpt?: { text: string; start: number; end: number };
  reference: { label: string; type: "regulatory_reference" | "company_policy" | "product_fact"; url?: string };
  suggestion?: string;
}
export interface Analysis {
  checks: CheckResult[];
  policyVersion: string;
  offerVersion: string | null;
  scope: string;
}
export interface Disposition {
  ruleId: string;
  action: "confirmed" | "dismissed";
  reason: string;
  actor: string;
  createdAt: string;
}
export interface ManualFinding {
  id: string;
  title: string;
  quote: string;
  reason: string;
  status: "open" | "resolved";
  resolution: string | null;
  createdAt: string;
}
export interface Revision {
  id: string;
  number: number;
  input: SubmissionInput;
  analysis: Analysis;
  contentHash: string;
  createdAt: string;
}
export interface Activity {
  id: string;
  type: "submitted" | "revised" | "finding_reviewed" | "manual_finding" | "finding_resolved" | "changes_requested" | "approved" | "deleted";
  actor: string;
  message: string;
  revision: number;
  createdAt: string;
}
export interface CaseSummary {
  id: string;
  title: string;
  productId: ProductId;
  publisher: string;
  format: AssetFormat;
  launchDate: string;
  status: CaseStatus;
  revision: number;
  findings: number;
  unknowns: number;
  createdAt: string;
  updatedAt: string;
}
export const dashboardQuerySchema = z.object({
  q: z.string().trim().max(200).default(""),
  product: z.enum(["all", ...productIds]).default("all"),
  status: z.enum(["all", "needs_information", "ready_for_review", "changes_requested", "approved"]).default("all"),
  sort: z.enum(["launchDate", "title", "updatedAt"]).default("launchDate"),
  direction: z.enum(["asc", "desc"]).default("asc"),
  role: z.enum(["reviewer", "submitter"]).default("reviewer"),
  today: submissionSchema.shape.launchDate.default(() => new Date().toISOString().slice(0, 10)),
}).strict();
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export interface DashboardResponse {
  rows: CaseSummary[];
  /** Search/product cohort before the queue-only status filter. */
  cohort: CaseSummary[];
  workspaceTotal: number;
  overview: {
    total: number;
    openCount: number;
    counts: Record<CaseStatus, number>;
    actionable: CaseSummary[];
    nextLaunchDate: string | null;
    overdueCount: number;
  };
}
export interface CaseDetail {
  case: CaseSummary;
  revisions: Revision[];
  dispositions: Disposition[];
  manualFindings: ManualFinding[];
  events: Activity[];
}
export interface DeleteCaseResult {
  deleted: true;
  id: string;
}
export type Result<T> = { ok: true; value: T } | { ok: false; error: { code: "not_found" | "conflict" | "invalid" | "blocked" | "storage"; message: string } };
export const success = <T>(value: T): Result<T> => ({ ok: true, value });
export const failure = <T = never>(code: "not_found" | "conflict" | "invalid" | "blocked" | "storage", message: string): Result<T> => ({ ok: false, error: { code, message } });
export const productLabels: Record<ProductId, string> = { card: "Credit card", personal_loan: "Personal loan", mortgage: "Mortgage prequalification", unknown: "Other / unknown" };
export const formatLabels: Record<AssetFormat, string> = { landing_page: "Landing page", email: "Email", banner: "Banner ad", social: "Social post", unknown: "Unknown format" };
export const statusLabels: Record<CaseStatus, string> = { needs_information: "Needs information", ready_for_review: "Ready for review", changes_requested: "Changes requested", approved: "Copy approved" };
