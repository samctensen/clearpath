import { z } from "zod";
export * from "./ai-review.ts";
export * from "./submission-guidance.ts";
export * from "./change-request.ts";
import type { ChangeRequestFeedback } from "./change-request.ts";
import type { DashboardRow } from "./submission-guidance.ts";

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
  /** Present on new change requests; legacy audit messages remain untouched. */
  changeRequest?: ChangeRequestFeedback;
  id: string;
  type: "submitted" | "revised" | "finding_reviewed" | "manual_finding" | "finding_resolved" | "changes_requested" | "approved" | "deleted";
  actor: string;
  message: string;
  revision: number;
  createdAt: string;
}
/**
 * The fields the review map and the overview need. Paging the queue must not cost a
 * findings scan over every matching case, so the cohort carries only these.
 */
export interface QueueCohortItem {
  id: string;
  title: string;
  launchDate: string;
  status: CaseStatus;
  createdAt: string;
}
export interface CaseSummary extends QueueCohortItem {
  productId: ProductId;
  publisher: string;
  format: AssetFormat;
  revision: number;
  findings: number;
  unknowns: number;
  updatedAt: string;
}
function isQueueTimestamp(value: string): boolean {
  // Accept the ISO and PostgreSQL forms we emit, preserving microsecond precision.
  const match = /^(\d{4}-\d{2}-\d{2})[T ](?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:0\d|1[0-5])(?::?[0-5]\d)?)$/.exec(value);
  return !!match && !match[1].startsWith("0000-") &&
    submissionSchema.shape.launchDate.safeParse(match[1]).success;
}
// Rejected at the boundary, so a tampered or stale cursor is a 400 and never a 500.
const cursorValue = z.string().min(1).max(512).refine((value) => {
  try {
    decodeQueueCursor(value);
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid queue cursor" });
export const dashboardQuerySchema = z.object({
  q: z.string().trim().max(200).default(""),
  product: z.enum(["all", ...productIds]).default("all"),
  status: z.enum(["all", "needs_information", "ready_for_review", "changes_requested", "approved"]).default("all"),
  view: z.enum(["all", "needs_attention", "awaiting_review", "approved"]).default("all"),
  sort: z.enum(["launchDate", "title", "updatedAt"]).default("launchDate"),
  direction: z.enum(["asc", "desc"]).default("asc"),
  role: z.enum(["reviewer", "submitter"]).default("reviewer"),
  today: submissionSchema.shape.launchDate.default(() => new Date().toISOString().slice(0, 10)),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  /** Keyset cursors. `after` walks forward, `before` walks back; never both. */
  after: cursorValue.optional(),
  before: cursorValue.optional(),
  /** `page` skips the cohort and overview work for a client that already holds them. */
  scope: z.enum(["full", "page"]).default("full"),
}).strict().refine((value) => !(value.after && value.before), {
  message: "Use either after or before, not both",
  path: ["after"],
}).superRefine((value, context) => {
  if (value.view !== "all" && (value.role !== "submitter" || value.status !== "all")) {
    context.addIssue({ code: "custom", message: "Submitter views require submitter role and all statuses", path: ["view"] });
  }
  if (value.sort !== "updatedAt") return;
  for (const direction of ["after", "before"] as const) {
    const encoded = value[direction];
    if (!encoded) continue;
    let cursor: QueueCursor;
    try { cursor = decodeQueueCursor(encoded); }
    catch { continue; } // cursorValue already reports malformed cursor payloads.
    if (cursor.key !== null && !isQueueTimestamp(cursor.key)) {
      context.addIssue({ code: "custom", message: "Invalid queue timestamp", path: [direction] });
    }
  }
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

/** Position of one page inside the filtered queue, counted exactly by the same query. */
export interface QueuePage {
  total: number;
  /** 1-based inclusive bounds of the rows on this page; 0 when the page is empty. */
  from: number;
  to: number;
  hasPrev: boolean;
  hasNext: boolean;
  startCursor: string | null;
  endCursor: string | null;
}
export interface DashboardOverview {
  total: number;
  openCount: number;
  counts: Record<CaseStatus, number>;
  actionable: QueueCohortItem[];
  nextLaunchDate: string | null;
  overdueCount: number;
}
export interface DashboardResponse {
  rows: DashboardRow[];
  submitterAttention: DashboardRow[] | null;
  page: QueuePage;
  /** Search/product cohort before the queue-only status filter; null under `scope=page`. */
  cohort: QueueCohortItem[] | null;
  workspaceTotal: number;
  overview: DashboardOverview | null;
}

/** Opaque to callers, so the ordering key can change without breaking saved links. */
export interface QueueCursor {
  /** The sort key of the row, or null when that row sorts into the NULLS LAST tail. */
  key: string | null;
  createdAt: string;
  id: string;
}
const queueCursorSchema = z.object({
  key: z.string().nullable(),
  createdAt: z.string().refine(isQueueTimestamp, "Invalid queue timestamp"),
  id: z.string().min(1),
}).strict();

export function encodeQueueCursor(cursor: QueueCursor): string {
  const json = JSON.stringify([cursor.key, cursor.createdAt, cursor.id]);
  const bytes = new TextEncoder().encode(json);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Throws on anything we did not issue, so a stale link fails loudly instead of silently resetting. */
export function decodeQueueCursor(value: string): QueueCursor {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  let parsed: unknown;
  try {
    const binary = atob(padded + "=".repeat((4 - padded.length % 4) % 4));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const [key, createdAt, id] = JSON.parse(new TextDecoder().decode(bytes));
    parsed = { key, createdAt, id };
  } catch {
    throw new Error("Invalid queue cursor");
  }
  const cursor = queueCursorSchema.safeParse(parsed);
  if (!cursor.success) throw new Error("Invalid queue cursor");
  return cursor.data;
}
export interface CaseDetail {
  case: CaseSummary;
  revisions: Revision[];
  dispositions: Disposition[];
  manualFindings: ManualFinding[];
  events: Activity[];
}
/** An immutable decision, described using the revision it actually reviewed. */
export interface DecisionRecord {
  id: string;
  caseId: string;
  caseDeleted: boolean;
  revision: number;
  currentRevision: number;
  title: string;
  productId: ProductId;
  publisher: string;
  decision: "approve" | "request_changes";
  feedback: string;
  actor: string;
  createdAt: string;
  policyVersion: string;
  offerVersion: string | null;
}
export interface PolicyRule {
  id: string;
  title: string;
  summary: string;
  products: ProductId[];
  reference: CheckResult["reference"];
  appliesWhen: string;
  prepare: string[];
  limits: string;
  example: { attention: string; better: string; explanation: string };
}
export interface PolicyGuideData { policyVersion: string; rules: PolicyRule[] }
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
