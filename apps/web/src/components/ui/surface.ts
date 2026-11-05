/** Shared surface and layout class strings, applied directly in JSX. */

export const panel = "cp-panel min-w-0 bg-panel border border-line rounded-panel";

export const panelHeading =
  "cp-panel-heading flex items-start justify-between gap-[14px] [&>p]:text-muted [&>p]:text-[13px] [&>p]:mt-[5px]";

export const panelCaption = "cp-panel-caption text-[13px] mt-[11px]";

export const sectionTitle = "flex items-center gap-[9px] [&>svg]:text-accent [&>svg]:shrink-0";

export const actionRow = "cp-action-row flex items-center flex-wrap gap-2";

export const textLink =
  "cp-text-link inline-flex items-center gap-1.5 text-accent text-[13px] font-medium hover:underline hover:underline-offset-[3px]";

export const backLink =
  "inline-flex items-center gap-1.5 text-muted text-[13px] font-medium mb-4 hover:underline hover:underline-offset-[3px]";

export const srOnly =
  "absolute w-px h-px p-0 overflow-hidden [clip-path:inset(50%)] whitespace-nowrap";

/** A definition list of short labelled terms, wrapping across the panel. */
export const termList = "flex flex-wrap gap-x-7 gap-y-[14px]";
export const termLabel = "text-muted text-xs";
export const termValue = "text-heading text-[14px] font-medium [overflow-wrap:anywhere]";
