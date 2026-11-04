
import { DashboardIcon } from "./dashboard/dashboard-icon";import { statusLabels, type CaseStatus } from "@clearpath/contracts";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const timestamp = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function formatDate(value: string) {
  return date.format(new Date(value));
}

export function formatTime(value: string) {
  return timestamp.format(new Date(value));
}

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`status-badge status-${status}`}><span aria-hidden="true" />{statusLabels[status]}</span>;
}

export function Loading({ label }: { label: string }) {
  return <div className="state-block" role="status"><DashboardIcon name="rotate-right" className="spinner" size={23} aria-hidden="true" />{label}…</div>;
}

export function ErrorMessage({ message, retry, retryLabel = "Try again" }: { message: string; retry?: () => void; retryLabel?: string }) {
  if (!message) return null;
  return (
    <div className="error-message" role="alert">
      <DashboardIcon name="circle-exclamation" size={18} aria-hidden="true" /><span>{message}</span>
      {retry && <button type="button" className="button secondary small" onClick={retry}>{retryLabel}</button>}
    </div>
  );
}
