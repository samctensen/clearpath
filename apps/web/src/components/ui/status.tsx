import type { CSSProperties } from "react";
import { statusLabels, type CaseStatus, type CheckStatus } from "@clearpath/contracts";
import { DashboardIcon } from "../dashboard/dashboard-icon";
import { cn } from "./cn";

/* Every tinted chip mixes one status colour against the panel, so the hue lives in a
   `--status` custom property and the recipe below is written once. */
type Tinted = { "--status": string } & CSSProperties;

const caseStatusColor: Record<CaseStatus, string> = {
  ready_for_review: "var(--color-ready)",
  needs_information: "var(--color-info)",
  changes_requested: "var(--color-waiting)",
  approved: "var(--color-approved)",
};

const statusBadge =
  "inline-flex items-center gap-[7px] px-2.5 py-1 rounded-full text-xs font-medium leading-[1.4] whitespace-nowrap " +
  "border border-[color-mix(in_srgb,var(--status)_27%,transparent)] " +
  "bg-[color-mix(in_srgb,var(--status)_13%,var(--color-panel))] " +
  "text-[color-mix(in_srgb,var(--status)_88%,var(--color-ink))]";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={statusBadge} style={{ "--status": caseStatusColor[status] } as Tinted}>
      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[var(--status)] flex-none" />
      {statusLabels[status]}
    </span>
  );
}

const checkLabels: Record<CheckStatus, string> = {
  passed: "Passed",
  finding: "Finding",
  unknown: "Unable to evaluate",
  not_applicable: "Not applicable",
};

const checkIcons: Record<CheckStatus, string> = {
  passed: "check",
  finding: "triangle-exclamation",
  unknown: "circle-question",
  not_applicable: "minus",
};

const checkColor: Record<Exclude<CheckStatus, "not_applicable">, string> = {
  passed: "var(--color-approved)",
  finding: "var(--color-info)",
  unknown: "var(--color-waiting)",
};

const checkBadge =
  "cp-check-badge inline-flex items-center gap-[5px] px-[7px] py-[3px] rounded-md border text-[11px] font-medium leading-[1.4] whitespace-nowrap";

const checkTint =
  "border-[color-mix(in_srgb,var(--status)_28%,#101010)] " +
  "bg-[color-mix(in_srgb,var(--status)_13%,#0b0b0b)] " +
  "text-[color-mix(in_srgb,var(--status)_80%,var(--color-ink))]";

/** `label` overrides the check wording where the same chip reports another state. */
export function CheckBadge({ status, label }: { status: CheckStatus; label?: string }) {
  const plain = status === "not_applicable";
  return (
    <span
      className={cn(checkBadge, plain ? "bg-raised border-line text-muted" : checkTint)}
      style={plain ? undefined : ({ "--status": checkColor[status] } as Tinted)}
    >
      <DashboardIcon name={checkIcons[status]} size={13} aria-hidden="true" />
      {label ?? checkLabels[status]}
    </span>
  );
}

export { checkLabels };
