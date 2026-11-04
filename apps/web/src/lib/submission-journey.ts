import type { Activity, CaseDetail, ManualFinding } from "@clearpath/contracts";

export type JourneyEvent = Pick<Activity, "id" | "type" | "revision" | "createdAt" | "message">;

export function buildSubmissionJourney(detail: CaseDetail): { events: JourneyEvent[]; currentRevision: number; openManualConcerns: ManualFinding[] } {
  const types: Activity["type"][] = ["submitted", "revised", "changes_requested", "approved"];
  const events = detail.events.filter(event => types.includes(event.type)).map(({ id, type, revision, createdAt, message }) => ({ id, type, revision, createdAt, message }));
  // Stable sorting preserves the API's source order when timestamps match.
  events.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  return { events, currentRevision: detail.case.revision, openManualConcerns: detail.manualFindings.filter(finding => finding.status === "open") };
}
