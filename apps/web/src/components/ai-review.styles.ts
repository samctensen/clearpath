/** Tailwind class map for the advisory AI review panel.
 *
 * The panel is deliberately quieter than the policy checks above it: no card chrome,
 * no accent fills, and one statement of its advisory nature instead of three. Every
 * rule and marker below carries information — a track boundary, a severity, or text
 * the model proposes but has not applied. */
export const styles = {
  /* The chevron sits in a gutter; body copy lines up with the summary title beside it. */
  panel: "min-w-0 mt-[18px] pl-[22px] max-[640px]:pl-0",

  /** Lead sentence and, before a review exists, the generate action beside it. */
  lead:
    "flex items-start justify-between flex-wrap gap-x-7 gap-y-3 " +
    "[&>p]:max-w-[66ch] [&>p]:text-[13px] [&>p]:leading-[1.7] [&>p]:text-[#bdbdbd]",

  status: "mt-[18px] max-w-[66ch] text-[13px] leading-[1.7]",

  empty: "mt-[18px] max-w-[66ch] text-muted text-[13px] leading-[1.7]",

  spinner: "text-accent animate-[spin_.8s_linear_infinite] motion-reduce:animate-none",

  /* Each track owns its own block, so a short compliance read simply ends rather than
     leaving a column rule running down empty space beside the marketing read. */
  tracks:
    "grid grid-cols-2 items-start gap-x-12 gap-y-10 mt-[26px] " +
    "max-[980px]:grid-cols-[minmax(0,1fr)] max-[980px]:gap-y-8",

  track: "min-w-0 text-[13px]",

  trackHeading:
    "flex items-baseline justify-between gap-4 pb-2.5 border-b border-b-line-strong " +
    "[&>h3]:m-0 [&>h3]:text-[14px] [&>h3]:font-semibold [&>h3]:text-heading [&>h3]:tracking-[-0.01em]",

  trackState: "text-muted text-xs whitespace-nowrap",

  prose: "max-w-[62ch] leading-[1.7] whitespace-pre-wrap [overflow-wrap:anywhere]",

  trackLead: "mt-3.5 text-[#bdbdbd]",

  body: "text-[#aaaaaa]",

  concerns: "mt-[18px]",

  concern:
    "min-w-0 pt-[18px] mt-[18px] border-t border-t-line first:pt-0 first:mt-0 first:border-t-0 " +
    "[&>h4]:m-0 [&>h4]:max-w-[56ch] [&>h4]:text-[13px] [&>h4]:font-semibold [&>h4]:text-heading [&>h4]:leading-[1.45]",

  /* Severity is real information the old grey chip threw away: hue plus the word. */
  severity:
    "flex items-center gap-[7px] mt-2 mb-3 text-[11px] " +
    "text-[color-mix(in_srgb,var(--sev)_70%,var(--color-ink))] " +
    "before:content-[''] before:w-[5px] before:h-[5px] before:rounded-full before:flex-none before:bg-[var(--sev)]",

  field:
    "mt-3.5 " +
    "[&>strong]:block [&>strong]:mb-[5px] [&>strong]:text-heading [&>strong]:text-xs [&>strong]:font-semibold",

  /* Wording the model proposes: a rule, not a fill, because none of it is applied. */
  wording:
    "mt-3.5 pl-[15px] border-l-2 border-l-[#4b3f61] " +
    "[&>strong]:block [&>strong]:mb-[5px] [&>strong]:text-heading [&>strong]:text-xs [&>strong]:font-semibold " +
    "[&>p]:text-[#d6d6d6]",

  references:
    "mt-4 text-[11px] " +
    "[&>summary]:inline-flex [&>summary]:items-center [&>summary]:gap-1.5 [&>summary]:cursor-pointer " +
    "[&>summary]:list-none [&>summary]:text-muted [&>summary:hover]:text-ink " +
    "[&>summary::-webkit-details-marker]:hidden " +
    "[&_.cr-chevron]:text-[#5f5f5f] [&_.cr-chevron]:transition-transform [&[open]_.cr-chevron]:rotate-90 " +
    "motion-reduce:[&_.cr-chevron]:transition-none " +
    "[&>ul]:mt-2.5 [&>ul]:mx-0 [&>ul]:mb-0 [&>ul]:pl-[17px] [&>ul]:list-disc [&>ul]:text-muted " +
    "[&_li]:marker:text-[#3f3f3f] [&_li]:leading-[1.6] [&_li+li]:mt-1",

  list:
    "mt-[22px] " +
    "[&>h4]:m-0 [&>h4]:text-xs [&>h4]:font-semibold [&>h4]:text-heading " +
    "[&>ul]:mt-2.5 [&>ul]:mx-0 [&>ul]:mb-0 [&>ul]:pl-[17px] [&>ul]:list-disc " +
    "[&_li]:marker:text-[#4a4a4a] [&_li+li]:mt-[7px]",

  listItem: "max-w-[60ch] leading-[1.65] text-[#aaaaaa] [overflow-wrap:anywhere]",

  added: "inline-flex gap-[6px] items-center mt-4 text-approved text-[11px]",

  promote: "mt-4",

  caution: "mt-5 max-w-[62ch] text-[#858585] text-xs leading-[1.65]",

  /* Provenance reads as one plain sentence at the foot, where a note's source belongs. */
  footnote: "mt-7 pt-4 border-t border-t-line max-w-[74ch] text-muted text-[11px] leading-[1.65]",

  /* A marketing excerpt is neutral here, not evidence behind a policy finding. */
  neutralQuote:
    "[&_.cp-evidence-quote]:bg-raised [&_.cp-evidence-quote]:border-line [&_.cp-evidence-quote]:text-[#d0d0d0]",
} as const;
