/** Tailwind class map for the advisory AI review panel. */
export const styles = {
  panel: "mt-6 p-[22px] max-[650px]:p-4",

  heading:
    "flex-wrap [&>div]:flex-[1_1_320px] [&>div]:min-w-0 [&_.cr-section-title]:flex-wrap",

  sectionTitle: "cr-section-title flex items-center gap-[9px] [&>svg]:text-accent [&>svg]:shrink-0",

  status: "mt-[14px] text-[13px]",

  empty: "mt-4 pt-[14px] border-t border-t-line text-muted text-[13px] max-w-[85ch]",

  metadata:
    "flex flex-wrap gap-x-7 gap-y-3 mt-[18px] py-[14px] border-y border-y-line text-xs " +
    "[&_dt]:text-muted [&_dd]:font-medium [&_dd]:[overflow-wrap:anywhere]",

  columns: "grid grid-cols-2 max-[650px]:grid-cols-[minmax(0,1fr)] gap-8 mt-[22px]",

  section:
    "min-w-0 text-[13px] " +
    "[&+&]:border-l [&+&]:border-l-line [&+&]:pl-7 " +
    "max-[650px]:[&+&]:pt-5 max-[650px]:[&+&]:px-0 max-[650px]:[&+&]:pb-0 " +
    "max-[650px]:[&+&]:border-l-0 max-[650px]:[&+&]:border-t max-[650px]:[&+&]:border-t-line " +
    "[&_h4]:m-0 [&_h4]:text-heading [&_h4]:text-[13px] [&_h4]:leading-[1.4] [&_h4]:font-medium",

  sectionHeading: "[&_h3]:text-[17px] [&>p]:mt-[9px] [&>p]:text-[#c9c9c9]",

  prose: "whitespace-pre-wrap [overflow-wrap:anywhere] leading-[1.7]",

  references: "mt-3 text-muted text-[11px] [&_ul]:mt-[7px] [&_ul]:mx-0 [&_ul]:mb-0 [&_ul]:pl-[18px]",

  list: "mt-[18px] [&_ul]:mt-[7px] [&_ul]:mx-0 [&_ul]:mb-0 [&_ul]:pl-[18px] [&_li+li]:mt-[7px]",

  suggestedWording:
    "mt-3 px-[14px] py-3 rounded-lg border border-[#3b2d4b] bg-[#19141f] " +
    "[&>strong]:text-[#c5a6ee] [&>strong]:font-medium [&>p]:mt-[5px]",

  concernAdded: "flex gap-[5px] items-center mt-3 text-approved text-xs",

  /* The marketing excerpt is neutral here, not a policy finding. */
  marketingCard: "[&_.cp-evidence-quote]:bg-raised [&_.cp-evidence-quote]:border-line [&_.cp-evidence-quote]:text-ink",

  spinner: "text-accent animate-[spin_.8s_linear_infinite] motion-reduce:animate-none",
} as const;
