/** Tailwind class map for the offer library page. */
export const styles = {
  page: "min-w-0 text-ink",

  policy: "inline-flex items-center gap-[7px] text-muted text-[11px] max-[600px]:text-[10px] whitespace-nowrap",

  layout:
    "grid grid-cols-[225px_minmax(0,1fr)] gap-8 items-start " +
    "min-[1500px]:grid-cols-[240px_minmax(0,1fr)] min-[1500px]:gap-[38px] " +
    "max-[1150px]:grid-cols-[190px_minmax(0,1fr)] max-[1150px]:gap-5 " +
    "max-[950px]:grid-cols-[minmax(0,1fr)] max-[950px]:gap-[22px]",

  index: "sticky top-7 min-w-0 max-[950px]:static",

  indexHeading:
    "flex items-center justify-between gap-3 mb-[15px] px-[9px] max-[950px]:p-0 max-[950px]:mb-2.5 " +
    "[&>h2]:text-ink [&>h2]:text-xs [&>h2]:font-semibold [&>span]:text-muted [&>span]:text-[11px]",

  indexNav: "grid gap-[5px] max-[950px]:flex max-[950px]:gap-2 max-[950px]:overflow-x-auto max-[950px]:pb-[5px]",

  indexLink:
    "flex items-center gap-[11px] min-h-[73px] px-[9px] py-[11px] rounded-[9px] border border-transparent text-muted " +
    "transition-[background-color,color] duration-150 " +
    "max-[950px]:min-w-[180px] max-[950px]:max-w-[220px] max-[950px]:flex-1 max-[950px]:border-line " +
    "max-[950px]:px-3 max-[950px]:py-2.5 max-[950px]:min-h-[70px] max-[950px]:bg-panel " +
    "[&>span:nth-child(2)]:flex-1 [&>span:nth-child(2)]:min-w-0 " +
    "max-[950px]:[&>span:last-child]:!hidden " +
    "[&_strong]:block [&_small]:block [&_small]:text-[10px] " +
    "[&_strong]:mt-[3px] [&_strong]:text-ink [&_strong]:text-xs [&_strong]:font-medium [&_strong]:leading-[1.6] [&_strong]:[overflow-wrap:anywhere] " +
    "hover:border-line hover:bg-panel hover:text-accent hover:[&_strong]:text-accent " +
    "aria-[current=true]:border-[#493264] aria-[current=true]:bg-[#1c1626] aria-[current=true]:text-[#bfa0f0] " +
    "aria-[current=true]:[&_strong]:text-[#e4d8f9]",

  indexNote: "mx-[9px] mt-[22px] pt-5 border-t border-line text-muted text-[11px] leading-[1.8] max-[950px]:hidden",

  references: "grid min-w-0 gap-7 max-[600px]:gap-[23px]",

  offer: "min-w-0 rounded-[13px] border border-line bg-panel scroll-mt-6 overflow-hidden",

  offerHeader:
    "flex items-center gap-[13px] px-7 pt-[26px] max-[1150px]:px-[22px] max-[1150px]:pt-[22px] " +
    "max-[600px]:items-start max-[600px]:flex-wrap max-[600px]:gap-[11px] max-[600px]:px-[18px] max-[600px]:pt-[21px]",

  productMark:
    "grid place-items-center w-[43px] h-[43px] max-[600px]:w-9 max-[600px]:h-9 shrink-0 " +
    "rounded-[10px] max-[600px]:rounded-lg border border-[#333] bg-raised text-[#bfbfbf]",

  offerTitle:
    "flex-1 min-w-0 max-[600px]:basis-[calc(100%-48px)] " +
    "[&>span]:block [&>span]:mb-1 [&>span]:text-muted [&>span]:text-[11px] " +
    "[&_h2]:text-ink [&_h2]:text-[19px] max-[600px]:[&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:leading-[1.35] " +
    "[&_h2]:tracking-[-.025em] [&_h2]:[overflow-wrap:anywhere]",

  version:
    "self-start mt-0.5 max-[600px]:ml-[47px] px-2 py-[3px] rounded-[5px] border border-line text-muted text-[10px] whitespace-nowrap",

  offerIntro:
    "px-7 pt-[18px] pb-[23px] max-[1150px]:px-[22px] max-[600px]:px-[18px] max-[600px]:pt-4 max-[600px]:pb-[21px] " +
    "[&>p]:max-w-[74ch] [&>p]:text-[#b1b1b1] [&>p]:text-xs [&>p]:leading-[1.8]",

  dates:
    "flex items-start gap-2 mt-3 text-muted text-[11px] max-[600px]:text-[10px] leading-[1.8] " +
    "[&>svg]:mt-0.5 [&>svg]:flex-none [&_time]:text-[#bbb]",

  referenceBody:
    "grid grid-cols-[minmax(210px,.85fr)_minmax(0,1.5fr)] border-t border-line " +
    "max-[1150px]:grid-cols-[minmax(200px,.8fr)_minmax(0,1.4fr)] " +
    "max-[950px]:grid-cols-[minmax(210px,.8fr)_minmax(0,1.5fr)] " +
    "max-[600px]:grid-cols-[minmax(0,1fr)]",

  termSection:
    "pl-7 pr-[26px] pt-[23px] pb-[27px] max-[1150px]:p-[22px] max-[600px]:px-[18px] max-[600px]:py-[21px] " +
    "[&>h3]:mb-[19px] [&>h3]:text-muted [&>h3]:text-[11px] [&>h3]:font-medium",

  /* Stacked rows inside the term column; the catalogue header uses the wide variant. */
  termsStacked:
    "grid grid-cols-[minmax(0,1fr)] gap-0 m-0 " +
    "[&>div]:min-w-0 [&>div]:flex [&>div]:justify-between [&>div]:items-baseline [&>div]:gap-4 [&>div]:py-[11px] " +
    "[&>div]:border-b [&>div]:border-b-line [&>div:first-child]:pt-0 [&>div:last-child]:border-b-0 [&>div:last-child]:pb-0 " +
    "[&_dt]:m-0 [&_dt]:text-muted [&_dt]:text-[11px] [&_dt]:font-normal " +
    "[&_dd]:shrink-0 [&_dd]:text-ink [&_dd]:text-xs [&_dd]:text-right [&_dd]:font-medium [&_dd]:leading-[1.4] [&_dd]:[overflow-wrap:anywhere]",

  termsGrid:
    "cp-terms grid grid-cols-2 gap-x-[22px] gap-y-[18px] m-0 " +
    "[&>div]:min-w-0 [&_dt]:mb-1 [&_dt]:text-muted [&_dt]:text-[11px] [&_dt]:font-normal " +
    "[&_dd]:text-ink [&_dd]:text-[15px] [&_dd]:font-medium [&_dd]:leading-[1.4] [&_dd]:[overflow-wrap:anywhere]",

  noTerms: "text-muted text-xs leading-[1.8]",

  example:
    "min-w-0 px-7 pt-[23px] pb-[27px] max-[1150px]:p-[22px] max-[600px]:px-[18px] max-[600px]:py-[21px] " +
    "border-l border-l-line max-[600px]:border-l-0 max-[600px]:border-t max-[600px]:border-t-line bg-[#121212] " +
    "[&>h3]:mb-[19px] [&>h3]:text-muted [&>h3]:text-[11px] [&>h3]:font-medium " +
    "[&_blockquote]:max-w-[70ch] [&_blockquote]:whitespace-pre-wrap [&_blockquote]:[overflow-wrap:anywhere] " +
    "[&_blockquote]:text-[#dedede] [&_blockquote]:text-[14px] max-[600px]:[&_blockquote]:text-[13px] [&_blockquote]:leading-[1.9]",

  notes:
    "mt-[25px] pt-[18px] border-t border-line " +
    "[&_h4]:mt-0 [&_h4]:mb-2 [&_h4]:text-muted [&_h4]:text-[11px] [&_h4]:font-semibold " +
    "[&_ul]:m-0 [&_ul]:pl-[15px] [&_ul]:text-muted [&_ul]:text-[11px] [&_ul]:leading-[1.8] " +
    "[&_li+li]:mt-[7px] [&_li]:marker:text-[#666]",

  offerFooter:
    "flex items-center justify-between gap-[18px] px-7 py-[17px] max-[1150px]:px-[22px] max-[1150px]:flex-wrap " +
    "max-[600px]:px-[18px] border-t border-line " +
    "[&>p]:max-w-[34ch] max-[1150px]:[&>p]:max-w-none [&>p]:text-muted [&>p]:text-[11px] [&>p]:leading-[1.7] " +
    "[&>a]:shrink-0 [&>a]:text-xs max-[600px]:[&>a]:w-full max-[600px]:[&>a]:min-h-[44px]",

  error: "mb-6",

  empty:
    "grid justify-items-center gap-[15px] px-6 py-[65px] rounded-[13px] border border-line bg-panel text-muted text-center " +
    "[&>h2]:text-ink [&>h2]:text-[18px] [&>h2]:font-medium [&>p]:text-[13px] [&>a]:mt-[7px] [&>button]:mt-[7px]",

  skeleton: "block h-12 rounded-[7px] bg-raised animate-[catalog-pulse_1.7s_ease-in-out_infinite] motion-reduce:animate-none motion-reduce:opacity-65",

  loadingIndex: "grid gap-[13px] px-[9px] max-[950px]:grid-cols-3 max-[950px]:p-0 [&>span]:h-[66px]",

  loadingOffer: "grid gap-[22px] p-7 max-[600px]:px-[18px] max-[600px]:py-[22px]",

  loadingTitle: "!w-[67%] !h-[30px]",

  loadingColumns: "grid grid-cols-[1fr_2fr] gap-7 max-[600px]:gap-[18px] [&>span]:h-[240px]",
} as const;
