import { dashboardQuerySchema, type DemoRole, type QueueCohortItem } from "@clearpath/contracts";
import { compareCases, parseDashboardFilters, type DashboardFilters, type QueuePosition } from "./dashboard.ts";

export type QueueReturn = { scrollY: number; anchorId: string | null; anchorTop: number };
export type QueueContext = {
  version: 1; role: DemoRole; filters: DashboardFilters; position: QueuePosition;
  pageStartCursor: string | null; selectedId: string | null; openedCaseId: string | null;
  returnTo: QueueReturn | null;
};
type QueueStorage = Pick<Storage, "getItem" | "setItem">;
const storageKey = (role: DemoRole) => `clearpath-queue-context-v1-${role}`;
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const identity = (value: unknown) => typeof value === "string" && value.length > 0 && value.length <= 200 ? value : null;

export function parseQueueContext(value: unknown, role: DemoRole): QueueContext | null {
  if (!object(value) || value.version !== 1 || value.role !== role || !object(value.position)) return null;
  const position = value.position;
  if (!(position.after === null || typeof position.after === "string") || !(position.before === null || typeof position.before === "string")) return null;
  const valid = dashboardQuerySchema.safeParse({ after: position.after ?? undefined, before: position.before ?? undefined });
  if (!valid.success) return null;
  const pageStartCursor = typeof value.pageStartCursor === "string" && dashboardQuerySchema.safeParse({ after: value.pageStartCursor }).success ? value.pageStartCursor : null;
  const saved = value.returnTo;
  const returnTo = object(saved) && typeof saved.scrollY === "number" && Number.isFinite(saved.scrollY) && saved.scrollY >= 0 && typeof saved.anchorTop === "number" && Number.isFinite(saved.anchorTop)
    ? { scrollY: saved.scrollY, anchorId: identity(saved.anchorId), anchorTop: saved.anchorTop } : null;
  return {
    version: 1, role, filters: parseDashboardFilters(value.filters, role),
    position: { after: position.after, before: position.before }, pageStartCursor,
    selectedId: identity(value.selectedId), openedCaseId: identity(value.openedCaseId), returnTo,
  };
}
export function readQueueContext(role: DemoRole, storage?: QueueStorage): QueueContext | null {
  try { return parseQueueContext(JSON.parse((storage ?? globalThis.sessionStorage).getItem(storageKey(role)) ?? "null"), role); }
  catch { return null; }
}
export function writeQueueContext(context: QueueContext, storage?: QueueStorage): void {
  try { (storage ?? globalThis.sessionStorage).setItem(storageKey(context.role), JSON.stringify(context)); }
  catch { /* Queue navigation still works when browser storage is unavailable. */ }
}

/** The API already scopes this cohort by search/product. Retain its queue status
 * filter and ordering, but determine eligibility from the freshly fetched status. */
export function nextReviewInQueue(cohort: readonly QueueCohortItem[], filters: DashboardFilters, currentId: string): QueueCohortItem | null {
  const ordered = [...cohort].sort((left, right) => compareCases(left, right, filters.sort));
  const index = ordered.findIndex(item => item.id === currentId);
  const following = [...ordered.slice(index + 1), ...ordered.slice(0, index + 1)];
  return following.find(item => item.id !== currentId && (item.status === "ready_for_review" || item.status === "needs_information") && (filters.status === "all" || item.status === filters.status)) ?? null;
}
export function emptyQueueRecovery(position: QueuePosition, pageStartCursor: string | null): QueuePosition {
  // Use the former first row, not the forward cursor (the previous page's last
  // row), so going back includes that previous boundary item even after deletion.
  return position.after && pageStartCursor ? { after: null, before: pageStartCursor } : { after: null, before: null };
}
export function queueReturnScroll(saved: QueueReturn, anchorDocumentTop?: number): number {
  return Math.max(0, anchorDocumentTop === undefined ? saved.scrollY : anchorDocumentTop - saved.anchorTop);
}
