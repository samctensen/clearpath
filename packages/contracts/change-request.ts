import type { CheckResult, Disposition, ManualFinding } from "./mod.ts";

/** Immutable feedback on the revision the reviewer actually reviewed. */
export interface ChangeRequestFeedback {
  note: string;
  items: ChangeRequestItem[];
}
export interface ChangeRequestItem {
  source: "check" | "manual";
  /** Correlation only; presentation uses the readable title. */
  sourceId: string;
  title: string;
  quote?: string;
  explanation?: string;
  nextStep: string;
  reviewerNote?: string;
}

/** Shared by the send preview and persistence so they describe the same request. */
export function buildChangeRequestFeedback({ note, checks, dispositions, manualFindings }: {
  note: string;
  checks: CheckResult[];
  dispositions: Pick<Disposition, "ruleId" | "action" | "reason">[];
  manualFindings: ManualFinding[];
}): ChangeRequestFeedback {
  const trimmedNote = note.trim();
  const items: ChangeRequestItem[] = [];
  for (const check of checks) {
    if (check.status !== "finding" && check.status !== "unknown") continue;
    const disposition = dispositions.find((item) => item.ruleId === check.ruleId);
    if (disposition?.action !== "confirmed") continue;
    const reason = disposition.reason.trim();
    const nextStep = check.suggestion?.trim() || reason || check.explanation.trim();
    const explanation = check.explanation.trim();
    items.push({
      source: "check", sourceId: check.ruleId, title: check.title,
      ...(check.excerpt?.text ? { quote: check.excerpt.text } : {}),
      ...(explanation && explanation !== nextStep && explanation !== trimmedNote ? { explanation } : {}),
      nextStep,
      ...(reason && ![trimmedNote, nextStep, explanation].includes(reason) ? { reviewerNote: reason } : {}),
    });
  }
  for (const finding of manualFindings) {
    if (finding.status !== "open") continue;
    items.push({ source: "manual", sourceId: finding.id, title: finding.title,
      ...(finding.quote ? { quote: finding.quote } : {}), nextStep: finding.reason.trim() });
  }
  // A reviewer may paste their correction into both note and concern. Show it once.
  return { note: items.some((item) => item.nextStep === trimmedNote) ? "" : trimmedNote, items };
}

/** Readable plain text for audit and existing compact feedback surfaces. */
export function formatChangeRequestFeedback(feedback: ChangeRequestFeedback): string {
  return [feedback.note, ...feedback.items.map((item) => [
    item.title,
    item.quote ? `“${item.quote}”` : "",
    item.explanation,
    `Next step: ${item.nextStep}`,
    item.reviewerNote ? `Reviewer note: ${item.reviewerNote}` : "",
  ].filter(Boolean).join("\n"))].filter(Boolean).join("\n\n");
}

/** Queue summaries stay concise while full evidence remains on the case. */
export function summarizeChangeRequestFeedback(feedback: ChangeRequestFeedback): string {
  return [feedback.note, ...feedback.items.map((item) => `${item.title}: ${item.nextStep}`)]
    .filter(Boolean).join("\n");
}
