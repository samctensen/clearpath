import type { CSSProperties, ReactNode } from "react";
import { DashboardIcon } from "../dashboard/dashboard-icon";
import { Button } from "./button";
import { cn } from "./cn";

export const stateBlock =
  "min-h-[148px] flex flex-col items-center justify-center gap-2 px-5 py-[30px] text-muted text-center";

export function Loading({ label }: { label: string }) {
  return (
    <div className={stateBlock} role="status">
      <DashboardIcon
        name="rotate-right"
        className="text-accent animate-[spin_.8s_linear_infinite]"
        size={23}
        aria-hidden="true"
      />
      {label}…
    </div>
  );
}

export function ErrorMessage({ message, retry, retryLabel = "Try again" }: {
  message: string;
  retry?: () => void;
  retryLabel?: string;
}) {
  if (!message) return null;
  return (
    <div
      className="cp-error flex items-start gap-[9px] max-[650px]:flex-wrap border border-[#694138] rounded-[10px] px-[14px] py-3 bg-[#251715] text-[#f4b4a5] text-[13px]"
      role="alert"
    >
      <DashboardIcon name="circle-exclamation" size={18} aria-hidden="true" className="flex-none mt-0.5" />
      <span className="flex-1 min-w-0 [overflow-wrap:anywhere]">{message}</span>
      {retry && (
        <Button variant="secondary" size="small" className="text-[#f4b4a5]" onClick={retry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

type Tone = "waiting" | "approved" | "concern";

const toneColor: Record<Tone, string> = {
  waiting: "var(--color-waiting)",
  approved: "var(--color-approved)",
  concern: "var(--color-info)",
};

const noticeClass =
  "cp-notice flex items-start gap-[11px] mb-[17px] px-4 py-[13px] rounded-[10px] " +
  "border border-[color-mix(in_srgb,var(--status)_28%,#101010)] " +
  "bg-[color-mix(in_srgb,var(--status)_12%,#0b0b0b)] " +
  "text-[color-mix(in_srgb,var(--status)_78%,var(--color-ink))] " +
  "[&>svg]:flex-none [&>svg]:mt-0.5 [&_strong]:font-semibold " +
  "[&_p]:mt-[3px] [&_p]:text-[13px] [&_p]:whitespace-pre-wrap [&_p:is(p)]:[overflow-wrap:anywhere]";

export function Notice({ tone = "waiting", className, children, ...rest }: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
  role?: string;
}) {
  return (
    <div
      className={cn(noticeClass, className)}
      style={{ "--status": toneColor[tone] } as { "--status": string } & CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
