import type { Activity, DecisionRecord, PolicyRule, ProductId } from "@clearpath/contracts";

export function hasDecisionFeedback(feedback: string) {
  const text = feedback.trim().toLowerCase().replace(/[.!]+$/, "");
  return text !== "" && !["copy approved", "approved", "changes requested"].includes(text);
}

/** Events are stored in sequence order. Never import a later revision's reasoning. */
export function decisionReviewEvents(events: Activity[], record: Pick<DecisionRecord, "revision" | "decision">) {
  const outcome = record.decision === "approve" ? "approved" : "changes_requested";
  const end = events.findIndex((event) => event.revision === record.revision && event.type === outcome);
  if (end < 0) return [];
  return events.slice(0, end).filter((event) => event.revision === record.revision &&
    ["finding_reviewed", "manual_finding", "finding_resolved"].includes(event.type));
}

export function matchesPolicy(rule: PolicyRule, query: string, product: string) {
  if (product !== "all" && !rule.products.includes(product as ProductId)) return false;
  const text = [rule.title, rule.summary, rule.id, rule.reference.label, rule.appliesWhen,
    rule.limits, ...rule.prepare, rule.example.attention, rule.example.better, rule.example.explanation].join(" ").toLowerCase();
  return text.includes(query.trim().toLowerCase());
}

export function parseRevisionParam(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
}

/** The decision list is paged. A linked record decides the page, so a deep link is never off-screen. */
export const decisionPageSize = 8;

export function decisionLogPage(total: number, requested: number, selectedIndex: number, pageSize = decisionPageSize) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = selectedIndex >= 0
    ? Math.min(Math.floor(selectedIndex / pageSize), pageCount - 1)
    : Math.min(Math.max(requested, 0), pageCount - 1);
  const start = page * pageSize;
  return { page, start, end: Math.min(start + pageSize, total), hasPrev: page > 0, hasNext: page < pageCount - 1 };
}
