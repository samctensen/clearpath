/** Shared styling for the policy-check cards, used by the review, AI and preview lists. */

export const checkList = "cp-check-list grid gap-0 mt-[14px]";

export const checkCard =
  "cp-check-card min-w-0 border-0 border-b border-b-line last:border-b-0 py-4 rounded-none bg-transparent text-[13px] [overflow-wrap:anywhere]";

export const checkCardHeading =
  "cp-check-heading flex items-start flex-wrap justify-between gap-x-3 gap-y-[7px] mb-2 [&>h3]:mt-0.5";

export const severityLabel = "cp-severity block mb-1.5 text-info text-[11px]";

export const checkChange = "cp-check-change mb-[9px] text-accent-soft text-xs";

export const evidenceQuote =
  "cp-evidence-quote block w-full max-h-[180px] overflow-auto my-3 px-3 py-2.5 rounded-lg border border-[#3a3020] " +
  "bg-[#211b11] text-[#e2c98e] text-[13px] leading-[1.65] text-left whitespace-pre-wrap [overflow-wrap:anywhere]";

export const evidenceJump = "hover:border-[#8a6830]";

export const suggestion =
  "cp-suggestion pt-2.5 text-muted [&>strong]:block [&>strong]:mb-[3px] [&>strong]:text-heading [&>strong]:font-medium";

export const sourceLine =
  "cp-source-line flex items-baseline flex-wrap gap-x-[7px] gap-y-[3px] mt-3 text-[11px] text-muted " +
  "[&_a]:inline-flex [&_a]:items-center [&_a]:gap-[3px] [&_a]:text-accent-soft [&_a]:underline [&_a]:underline-offset-[3px] " +
  "[&_svg]:flex-none";

export const findingActions = "cp-finding-actions mt-3 empty:hidden";

export const disposition =
  "px-3 py-2.5 my-2.5 rounded-lg bg-raised text-[#c2c2c2] whitespace-pre-wrap [overflow-wrap:anywhere] " +
  "[&>strong]:block [&>strong]:mb-[3px] [&>strong]:text-heading [&>strong]:font-medium";

export const coverageSummary =
  "cp-coverage flex items-center flex-wrap gap-x-[14px] gap-y-1.5 list-none mt-3 p-0 text-xs text-muted [&>li]:flex [&>li]:gap-[5px] [&>li]:items-center";
