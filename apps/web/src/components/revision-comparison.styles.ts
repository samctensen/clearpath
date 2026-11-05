/** Tailwind class map for the revision diff panel. */
export const styles = {
  comparison:
    "min-w-0 p-6 max-[640px]:px-[18px] max-[640px]:py-5 mb-6 rounded-[10px] border border-line bg-[#101010] " +
    "[&_del]:px-[3px] [&_del]:py-px [&_del]:text-[#f0c6a3] [&_del]:bg-[#58372180] [&_del]:line-through [&_del]:[text-decoration-thickness:1px] " +
    "[&_ins]:px-[3px] [&_ins]:py-px [&_ins]:text-[#bce6d0] [&_ins]:bg-[#1b553b80] [&_ins]:underline [&_ins]:[text-decoration-thickness:2px] [&_ins]:underline-offset-[3px]",

  heading:
    "flex flex-wrap items-center gap-[9px] " +
    "[&>h2]:text-base [&>h2]:font-[650] [&>h2]:tracking-[-.025em] " +
    "[&>span:last-child]:text-[#999] [&>span:last-child]:text-[11px] max-[640px]:[&>span:last-child]:w-full",

  sectionHeading: "flex flex-wrap items-center gap-[9px]",

  scope: "text-[#aaa] text-xs leading-[1.75] max-w-[90ch] mt-2.5",
  hint: "text-[#aaa] text-xs leading-[1.75] mt-[9px]",

  section:
    "mt-[21px] pt-5 border-t border-line " +
    "[&>h3]:text-[13px] [&>h3]:font-[650] [&>h3>span]:ml-[7px] [&>h3>span]:text-[#999] [&>h3>span]:text-[11px]",

  legend: "flex gap-[9px] ml-auto text-[11px]",

  diff:
    "max-h-[22rem] overflow-y-auto mt-[15px] px-[17px] py-[15px] max-[640px]:p-3 rounded-[7px] border border-[#303030] " +
    "text-[#bbb] text-[14px] leading-[1.95] whitespace-pre-wrap [overflow-wrap:anywhere]",

  omitted: "text-[#777]",

  fullCopy:
    "mt-[14px] [&>summary]:w-fit [&>summary]:py-[9px] max-[640px]:[&>summary]:min-h-[44px] max-[640px]:[&>summary]:py-3 " +
    "[&>summary]:text-[#c6b3df] [&>summary]:text-xs [&>summary]:cursor-pointer",

  unchanged:
    "mt-[14px] [&>summary]:w-fit [&>summary]:py-[9px] max-[640px]:[&>summary]:min-h-[44px] max-[640px]:[&>summary]:py-3 " +
    "[&>summary]:text-[#c6b3df] [&>summary]:text-xs [&>summary]:cursor-pointer " +
    "[&_ul]:mt-1.5 [&_ul]:mb-0 [&_ul]:pl-5 [&_ul]:text-[#aaa] [&_ul]:text-xs [&_ul]:leading-[1.8]",

  columns:
    "grid grid-cols-2 max-[640px]:grid-cols-[minmax(0,1fr)] gap-[22px] max-[640px]:gap-[18px] mt-[14px] " +
    "[&>div]:min-w-0 [&_h4]:mb-2.5 [&_h4]:text-[#aaa] [&_h4]:text-[11px] [&_h4]:font-semibold",

  copy:
    "max-h-[24rem] overflow-y-auto p-[14px] rounded-[7px] border border-[#303030] " +
    "text-[#ccc] text-[13px] leading-[1.85] whitespace-pre-wrap [overflow-wrap:anywhere]",

  metadata:
    "mt-[13px] " +
    "[&>div]:grid [&>div]:grid-cols-[minmax(110px,.6fr)_minmax(0,1fr)_minmax(0,1fr)] [&>div]:gap-4 [&>div]:py-[13px] " +
    "[&>div]:border-t [&>div]:border-t-[#252525] [&>div]:text-xs [&>div]:leading-[1.7] " +
    "max-[640px]:[&>div]:grid-cols-2 max-[640px]:[&>div]:gap-x-[14px] max-[640px]:[&>div]:gap-y-2 " +
    "[&_dt]:text-[#bbb] [&_dt]:font-semibold max-[640px]:[&_dt]:col-span-full " +
    "[&_dd]:min-w-0 [&_dd]:m-0 [&_dd]:text-[#ddd] [&_dd]:whitespace-pre-wrap [&_dd]:[overflow-wrap:anywhere] " +
    "[&_dd>span]:block [&_dd>span]:mb-[3px] [&_dd>span]:text-[#888] [&_dd>span]:text-[10px]",

  checkChange:
    "py-[13px] border-b border-b-[#252525] " +
    "[&>summary]:text-[#c9c9c9] [&>summary]:text-xs [&>summary]:cursor-pointer [&>summary]:leading-[1.7] " +
    "max-[640px]:[&>summary]:min-h-[44px] max-[640px]:[&>summary]:py-3 " +
    "[&>summary_strong]:font-semibold " +
    "[&>summary_span]:inline-block [&>summary_span]:ml-3 [&>summary_span]:text-[#aaa] [&>summary_span]:text-[11px] " +
    "max-[640px]:[&>summary_span]:block max-[640px]:[&>summary_span]:mx-0 max-[640px]:[&>summary_span]:mt-1 max-[640px]:[&>summary_span]:mb-0",

  evidence:
    "text-[#aaa] text-xs leading-[1.75] " +
    "[&_p]:mt-[9px] [&_p]:[overflow-wrap:anywhere] " +
    "[&_p_strong]:block [&_p_strong]:mb-[3px] [&_p_strong]:text-[#c7c7c7] [&_p_strong]:text-[11px] " +
    "[&_blockquote]:mt-2.5 [&_blockquote]:mx-0 [&_blockquote]:mb-0 [&_blockquote]:pl-3 [&_blockquote]:border-l-2 " +
    "[&_blockquote]:border-l-[#65512f] [&_blockquote]:text-[#d3c4ad] [&_blockquote]:whitespace-pre-wrap [&_blockquote]:[overflow-wrap:anywhere]",

  reference: "text-[#888] text-[11px]",
} as const;
