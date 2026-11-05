/**
 * Tailwind class map for the submission journey timeline.
 *
 * The needs-attention and current-state panels this stylesheet also served were
 * replaced by the fix-patterns chart; their rules are not carried over.
 */
export const styles = {
  historyHeading: "flex items-start justify-between gap-3 [&_h3]:text-[15px] [&_h3]:mt-1 [&_h3]:mx-0 [&_h3]:mb-0",

  muted: "text-muted text-xs leading-[1.5] mt-[5px] mx-0 mb-0",

  textButton:
    "bg-none border-0 text-[#c3abff] cursor-pointer font-[inherit] text-[13px] font-[650] px-0 py-0.5 text-left " +
    "hover:text-[#e0d4ff] hover:underline " +
    "aria-[pressed=true]:text-ink aria-[pressed=true]:underline aria-[pressed=true]:decoration-accent aria-[pressed=true]:underline-offset-4 " +
    "focus-visible:outline-2 focus-visible:outline-[#c3abff] focus-visible:outline-offset-[3px] focus-visible:rounded-[3px]",

  history: "mt-4",

  timeline: "flex max-[600px]:block list-none mt-[14px] max-[600px]:mt-[15px] mx-0 mb-0 p-0",

  /* Horizontal rail on desktop; below 600px the rail turns vertical down the left. */
  event:
    "flex-[1_1_0] min-w-0 relative max-[600px]:pt-0 max-[600px]:pr-0 max-[600px]:pb-[18px] max-[600px]:pl-[27px] " +
    "[&:not(:last-child)]:after:absolute [&:not(:last-child)]:after:content-[''] " +
    "[&:not(:last-child)]:after:left-3 [&:not(:last-child)]:after:right-0 [&:not(:last-child)]:after:top-1.5 " +
    "[&:not(:last-child)]:after:h-0.5 [&:not(:last-child)]:after:bg-[#5a506b] " +
    "max-[600px]:[&:not(:last-child)]:after:left-1.5 max-[600px]:[&:not(:last-child)]:after:right-auto " +
    "max-[600px]:[&:not(:last-child)]:after:top-[13px] max-[600px]:[&:not(:last-child)]:after:bottom-0 " +
    "max-[600px]:[&:not(:last-child)]:after:w-0.5 max-[600px]:[&:not(:last-child)]:after:h-auto",

  eventLink:
    "block max-[600px]:flex max-[600px]:gap-3 max-[600px]:-ml-[27px] text-inherit relative no-underline z-[1] pr-2.5 " +
    "hover:[&_strong]:underline " +
    "focus-visible:outline-2 focus-visible:outline-[#c3abff] focus-visible:outline-offset-[3px] focus-visible:rounded-[3px]",

  node: "sub-node block w-[14px] h-[14px] border-2 rounded-full max-[600px]:flex-none",

  eventText:
    "flex flex-col gap-[3px] pt-[9px] max-[600px]:pt-0 text-muted text-[11px] leading-[1.35] [overflow-wrap:anywhere] " +
    "[&_strong]:text-[#eeeaf3] [&_strong]:text-xs",
} as const;

/** The dot colour reports the outcome each event recorded. */
export const eventNodeColor: Record<string, string> = {
  approved: "border-approved bg-approved",
  changes_requested: "border-waiting bg-waiting",
};

export const defaultEventNodeColor = "border-ready bg-ready";
