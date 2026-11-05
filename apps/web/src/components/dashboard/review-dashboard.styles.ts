/**
 * Tailwind class map for the review dashboard: the up-next panel and the queue table
 * that reflows into cards below 650px.
 *
 * The source stylesheet carried two identical `max-width: 1180px` blocks where the
 * second overrode the first; only the surviving values are kept here.
 */
export const styles = {
  dashboard: "[overflow-anchor:none] min-w-0 text-ink [font-variant-numeric:tabular-nums] [&_:is(h1,h2,h3)]:text-ink",

  primary:
    "inline-flex justify-center items-center gap-2 min-h-9 max-[650px]:min-h-[44px] max-[650px]:flex-[1_1_100%] px-[14px] " +
    "rounded-lg text-[13px] font-semibold whitespace-nowrap " +
    "bg-accent-fill border border-accent-fill shadow-[0_2px_7px_#6d28d92b,inset_0_1px_0_#ffffff0d] text-white " +
    "transition-[background-color] duration-150 hover:bg-accent-fill-hover",

  secondary:
    "inline-flex justify-center items-center gap-2 min-h-9 max-[650px]:min-h-[44px] px-[14px] " +
    "rounded-lg text-[13px] font-semibold whitespace-nowrap " +
    "bg-transparent border border-line text-ink transition-[border-color] duration-150 hover:border-accent",

  product: "w-[166px] max-w-[190px] max-[650px]:flex-[1_1_100%] max-[650px]:w-full max-[650px]:max-w-none",
  statusFilter: "min-w-[172px] max-w-[210px] max-[650px]:flex-1 max-[650px]:min-w-0 max-[650px]:max-w-none",

  overviewGrid:
    "grid grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)] gap-4 items-start mb-5 " +
    "max-[1180px]:grid-cols-[minmax(0,1fr)] min-[1001px]:max-[1280px]:grid-cols-[minmax(0,1fr)]",

  nextPanel:
    "flex flex-col min-w-0 px-[18px] pt-4 pb-1.5 max-[650px]:px-[14px] max-[650px]:pt-[14px] " +
    "rounded-[14px] border border-line bg-panel",

  panelHeading:
    "flex items-start justify-between gap-2.5 mb-1 pb-3 border-b border-b-line " +
    "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:tracking-[-.02em] " +
    "[&_p]:mt-[3px] [&_p]:text-muted [&_p]:text-xs [&_p]:leading-[1.4]",

  nextList: "min-w-0 min-[1001px]:max-[1280px]:grid min-[1001px]:max-[1280px]:grid-cols-3 min-[1001px]:max-[1280px]:gap-4",

  nextFooter:
    "flex justify-between gap-3 py-3 border-t border-t-line text-xs text-muted " +
    "[&_a]:text-accent hover:[&_a]:underline " +
    "max-[650px]:[&_a]:inline-flex max-[650px]:[&_a]:items-center max-[650px]:[&_a]:min-h-[44px]",

  overdueNote: "py-3 border-t border-t-line text-info text-xs",

  nextItem:
    "flex gap-3 items-center py-[11px] border-b border-b-line last:border-0 min-[1001px]:max-[1280px]:border-0 " +
    "[&>div]:flex-1 [&>div]:min-w-0 " +
    "[&_strong]:block [&_strong]:overflow-hidden [&_strong]:text-[13px] [&_strong]:font-medium [&_strong]:leading-[1.4] " +
    "[&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:transition-[color] [&_strong]:duration-150 " +
    "[&>div>span]:flex [&>div>span]:items-center [&>div>span]:flex-wrap [&>div>span]:gap-[7px] [&>div>span]:mt-1 " +
    "[&>div>span]:text-muted [&>div>span]:text-xs " +
    "[&_i]:inline-block [&_i]:w-[7px] [&_i]:h-[7px] [&_i]:rounded-full " +
    "[&>svg]:text-muted [&>svg]:transition-[transform,color] [&>svg]:duration-150 " +
    "hover:[&_strong]:text-accent hover:[&>svg]:text-accent hover:[&>svg]:translate-x-[3px]",

  nextDate:
    "ml-auto font-mono text-[11px] min-[1001px]:max-[1280px]:w-full min-[1001px]:max-[1280px]:ml-3",

  nextEmpty:
    "flex col-span-full flex-col items-center justify-center gap-2.5 min-h-[140px] p-4 text-muted text-[13px] text-center",

  cohortNote: "max-w-[74ch] -mt-2 mb-4 text-muted text-xs leading-[1.5]",

  queue: "rounded-[14px] border border-line bg-panel overflow-hidden scroll-mt-5",

  queueHeading:
    "flex items-center justify-between gap-4 px-[18px] py-[14px] " +
    "max-[650px]:items-stretch max-[650px]:flex-col max-[650px]:gap-2.5 max-[650px]:p-[14px]",

  queueTitle:
    "flex items-baseline gap-2.5 [&>svg]:hidden " +
    "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-[-.02em] " +
    "[&>span:last-child]:px-2 [&>span:last-child]:py-px [&>span:last-child]:rounded-[99px] " +
    "[&>span:last-child]:bg-raised [&>span:last-child]:text-muted [&>span:last-child]:text-xs [&>span:last-child]:font-semibold",

  queueControls: "flex gap-2",

  sortButton:
    "hidden max-[650px]:flex max-[650px]:min-h-[44px] max-[650px]:px-3 items-center gap-1.5 px-3 py-2 " +
    "rounded-[9px] border border-line bg-raised text-ink text-xs",

  tableWrap: "overflow-x-auto",

  table:
    "w-full border-collapse text-[13px] text-left " +
    "[&_th]:px-4 [&_th]:py-[9px] [&_th]:border-y [&_th]:border-y-line [&_th]:text-muted [&_th]:text-[11px] " +
    "[&_th]:font-semibold [&_th]:tracking-normal [&_th]:whitespace-nowrap " +
    "[&_th:first-child]:pl-[18px] [&_td:first-child]:pl-[18px] [&_th:last-child]:pr-[18px] [&_td:last-child]:pr-[18px] " +
    "[&_th_button]:flex [&_th_button]:items-center [&_th_button]:gap-[7px] [&_th_button]:p-0 [&_th_button]:border-0 " +
    "[&_th_button]:bg-none [&_th_button]:text-inherit [&_th_button]:font-[inherit] [&_th_button]:tracking-[inherit] " +
    "[&_th_button]:normal-case hover:[&_th_button]:text-ink " +
    "[&_td]:px-4 [&_td]:py-3 max-[1180px]:[&_td]:p-3 [&_td]:border-b [&_td]:border-b-line [&_td]:text-ink " +
    "[&_td:first-child]:max-w-[400px] [&_tr:last-child_td]:border-b-0 " +
    "[&_tbody_tr]:transition-[background-color] [&_tbody_tr]:duration-150 hover:[&_tbody_tr]:bg-raised " +
    "[&_td>small]:block [&_td>small]:mt-0.5 [&_td>small]:text-muted [&_td>small]:text-xs " +
    /* Below 650px the table reflows into one card per row, labelled from data-label. */
    "max-[650px]:block max-[650px]:[&_tbody]:block " +
    "max-[650px]:[&_thead]:absolute max-[650px]:[&_thead]:w-px max-[650px]:[&_thead]:h-px " +
    "max-[650px]:[&_thead]:overflow-hidden max-[650px]:[&_thead]:[clip-path:inset(50%)] " +
    "max-[650px]:[&_thead_button]:hidden " +
    "max-[650px]:[&_tr]:grid max-[650px]:[&_tr]:grid-cols-2 max-[650px]:[&_tr]:gap-x-3 max-[650px]:[&_tr]:gap-y-2.5 " +
    "max-[650px]:[&_tr]:p-[14px] max-[650px]:[&_tr]:border-t max-[650px]:[&_tr]:border-t-line " +
    "max-[650px]:[&_td]:min-w-0 max-[650px]:[&_td]:max-w-none max-[650px]:[&_td]:p-0 max-[650px]:[&_td]:border-0 " +
    "max-[650px]:[&_td:first-child]:col-span-full " +
    "max-[650px]:[&_td]:before:content-[attr(data-label)] max-[650px]:[&_td]:before:block " +
    "max-[650px]:[&_td]:before:mb-[3px] max-[650px]:[&_td]:before:text-muted max-[650px]:[&_td]:before:text-[11px] " +
    "max-[650px]:[&_td]:before:font-semibold max-[650px]:[&_td:first-child]:before:hidden",

  campaign:
    "flex items-center gap-3 max-[650px]:min-h-[44px] " +
    "[&>span]:min-w-0 " +
    "[&_strong]:block [&_strong]:text-ink [&_strong]:text-[14px] [&_strong]:font-medium [&_strong]:leading-[1.4] " +
    "[&_strong]:transition-[color] [&_strong]:duration-150 max-[650px]:[&_strong]:[overflow-wrap:anywhere] " +
    "[&_small]:flex [&_small]:items-center [&_small]:gap-[7px] [&_small]:mt-0.5 [&_small]:text-muted [&_small]:text-xs " +
    "max-[650px]:[&_small]:flex-wrap max-[650px]:[&_small]:[overflow-wrap:anywhere] " +
    "[&_small>span]:text-line " +
    "hover:[&_strong]:text-accent",

  /* The case link is stretched over the whole row; link and keyboard behaviour stay native. */
  queueRow:
    "relative " +
    "[&_a::after]:content-[''] [&_a::after]:absolute [&_a::after]:inset-0 [&_a::after]:z-[1] [&_a::after]:cursor-pointer " +
    "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-accent has-[a:focus-visible]:-outline-offset-2 " +
    "[&_a:focus-visible]:outline-none " +
    "max-[650px]:[&>td:first-child]:pr-11",

  rowActions:
    "w-[52px] !pl-0 [&>*]:relative [&>*]:z-[2] " +
    "max-[650px]:!absolute max-[650px]:top-2.5 max-[650px]:right-2.5 max-[650px]:w-9 max-[650px]:z-[2] " +
    "max-[650px]:before:hidden",

  productName: "block max-w-[160px] max-[650px]:max-w-none text-[13px]",
  date: "font-mono text-xs whitespace-nowrap",
  checks: "text-[13px] whitespace-nowrap [&>small]:block [&>small]:mt-0.5 [&>small]:text-muted [&>small]:text-xs",
  finding: "inline-flex items-center gap-1.5 text-info",

  status:
    "inline-flex items-center gap-[7px] min-h-[27px] px-[9px] py-1 rounded-[99px] " +
    "border border-[color-mix(in_srgb,var(--status-color)_27%,#202020)] " +
    "bg-[color-mix(in_srgb,var(--status-color)_13%,#101010)] " +
    "text-[color-mix(in_srgb,var(--status-color)_88%,var(--color-ink))] " +
    "text-[11.5px] font-medium leading-[1.35] whitespace-nowrap " +
    "max-[650px]:max-w-full max-[650px]:text-[11px] max-[650px]:whitespace-normal " +



    "[&_i]:flex-none [&_i]:w-1.5 [&_i]:h-1.5 [&_i]:rounded-full [&_i]:bg-current",

  queueFooter:
    "flex items-center flex-wrap gap-x-[14px] gap-y-2 px-[18px] py-[11px] max-[650px]:px-[14px] max-[650px]:py-3 " +
    "border-t border-t-line text-muted text-xs " +
    "[&>button]:p-0 [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-accent [&>button]:text-xs " +
    "[&>button]:font-semibold max-[650px]:[&>button]:min-h-[44px] " +
    "hover:[&>button]:underline hover:[&>button]:underline-offset-[3px]",

  pager: "flex items-center gap-1.5",

  pagerStep:
    "inline-grid place-items-center w-7 h-7 max-[650px]:w-11 p-0 rounded-lg border border-line bg-raised text-ink " +
    "transition-[border-color,background-color] duration-150 hover:no-underline " +
    "hover:not-disabled:border-[#363636] hover:not-disabled:bg-[#242424] disabled:opacity-40",

  checkNote: "ml-auto max-[1180px]:ml-0 max-[650px]:w-full",

  empty:
    "px-6 py-10 border-t border-t-line text-muted text-center " +
    "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:mb-[18px] [&_p]:text-[13px]",

  error:
    "flex items-center gap-4 mb-4 p-5 max-[650px]:flex-wrap max-[650px]:p-4 " +
    "rounded-[14px] border border-line border-l-[3px] border-l-info bg-panel text-info " +
    "[&_h2]:text-ink [&_h2]:text-base [&_h2]:font-semibold " +
    "[&_p]:mt-1 [&_p]:text-muted [&_p]:text-[13px] " +
    "[&>button]:ml-auto max-[650px]:[&>button]:ml-[38px] max-[650px]:[&>div]:flex-1",

  disclaimer:
    "flex items-center gap-2.5 pt-[18px] text-muted text-xs " +
    "max-[650px]:items-start max-[650px]:leading-[1.6] max-[650px]:[&>svg]:mt-[3px] " +
    "[&>span:last-child]:ml-auto [&>span:last-child]:text-[11px] [&>span:last-child]:whitespace-nowrap " +
    "max-[650px]:[&>span:last-child]:hidden",

  mobileDateLabel: "hidden max-[650px]:inline",

  /* Submitter list: actions and human feedback outrank check totals. */
  submissionViews:
    "flex items-center justify-between gap-3 px-[18px] pb-[14px] border-b border-b-line " +
    "max-[720px]:block max-[720px]:px-[14px] max-[720px]:pb-3 " +
    "[&>p]:m-0 [&>p]:text-muted [&>p]:text-[11px] [&>p]:whitespace-nowrap max-[720px]:[&>p]:mt-2",

  viewTabs:
    "flex flex-wrap gap-[5px] max-[720px]:gap-1 " +
    "[&>button]:inline-flex [&>button]:items-center [&>button]:gap-[7px] [&>button]:border [&>button]:border-transparent " +
    "[&>button]:bg-transparent [&>button]:text-muted [&>button]:px-2.5 [&>button]:py-[7px] max-[720px]:[&>button]:px-2 " +
    "[&>button]:rounded-lg [&>button]:font-[inherit] [&>button]:text-xs [&>button]:cursor-pointer " +
    "hover:[&>button]:bg-raised hover:[&>button]:text-ink " +
    "[&>button[aria-pressed=true]]:bg-[#211631] [&>button[aria-pressed=true]]:border-[#45305f] [&>button[aria-pressed=true]]:text-[#ede4ff] " +
    "[&>button_span]:text-[10px] [&>button_span]:text-inherit [&>button_span]:opacity-80",

  nextStep:
    "max-w-[290px] max-[720px]:max-w-none " +
    "[&>span]:block [&>span]:text-[#ddd] [&>span]:text-xs " +
    "[&_small]:line-clamp-2 [&_small]:max-w-[290px] [&_small]:leading-[1.5]",

  nextAction:
    "relative z-[2] inline-flex items-center min-h-6 max-[720px]:min-h-[44px] text-accent text-xs font-semibold " +
    "underline underline-offset-[3px] hover:text-[#e0cdff] " +
    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 focus-visible:rounded-[3px]",

  guidanceText: "!line-clamp-3 [overflow-wrap:anywhere] text-[#c9c9c9]",
  guidanceMeta: "text-[11px]",

  reasonFilter:
    "flex items-center flex-wrap gap-2 px-[18px] py-2 max-[720px]:px-[14px] text-muted text-xs " +
    "[&>button]:inline-flex [&>button]:items-center [&>button]:gap-3 [&>button]:min-h-[44px] [&>button]:max-w-full " +
    "[&>button]:px-3 [&>button]:py-[7px] [&>button]:rounded-lg [&>button]:border [&>button]:border-[#45305f] " +
    "[&>button]:bg-[#211631] [&>button]:text-[#ede4ff] [&>button]:text-left [&>button]:font-[inherit] " +
    "hover:[&>button]:border-accent " +
    "[&>button]:focus-visible:outline-2 [&>button]:focus-visible:outline-accent [&>button]:focus-visible:outline-offset-2 " +
    "[&>button_span:first-child]:[overflow-wrap:anywhere] " +
    "[&>button_span:last-child]:flex-none [&>button_span:last-child]:text-lg",
} as const;
