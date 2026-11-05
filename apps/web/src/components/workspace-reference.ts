/**
 * Tailwind class map for the two reference pages — the policy guide and the decision
 * log. They share a layout vocabulary, so the names live here rather than being
 * repeated across both components.
 */
export const styles = {
  page: "min-w-0",

  sectionHeading:
    "flex items-center justify-between gap-3 mb-4 " +
    "[&_h2]:text-xs [&_h2]:font-semibold [&_h2]:scroll-mt-6 [&_h3]:text-xs [&_h3]:font-semibold " +
    "[&>span]:text-muted [&>span]:text-[11px]",

  /* Policy guide */
  guideLayout:
    "grid grid-cols-[270px_minmax(0,1fr)] items-start gap-[30px] " +
    "max-[1200px]:grid-cols-[220px_minmax(0,1fr)] max-[1200px]:gap-5 " +
    "max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-[22px]",

  guideIndex:
    "min-w-0 sticky top-6 max-[900px]:static " +
    "[&>nav]:grid [&>nav]:gap-1.5 [&>nav]:scroll-mt-6 max-[900px]:[&>nav]:block",

  ruleGroup:
    "[&+&]:mt-[22px] [&>h3]:mx-[11px] [&>h3]:mt-0 [&>h3]:mb-[7px] [&>h3]:text-[#a3a3a3] [&>h3]:text-xs [&>h3]:font-medium " +
    "max-[900px]:[&>h3]:ml-0",

  ruleLink:
    "block p-[11px] max-[900px]:px-[11px] max-[900px]:py-2.5 max-[900px]:min-h-[44px] rounded-md border border-transparent " +
    "text-[#c7c7c7] text-[13px] leading-[1.65] hover:bg-panel hover:text-[#eee] " +
    "aria-[current=true]:bg-[#1b1525] aria-[current=true]:border-[#493264] aria-[current=true]:text-[#eadffb]",

  indexNote:
    "mx-[11px] mt-[23px] pt-[18px] border-t border-line text-[#999] text-xs " +
    "max-[900px]:mx-0 max-[900px]:mt-4 max-[900px]:pt-[14px]",

  guideDetail: "min-w-0 rounded-[13px] border border-line bg-panel overflow-hidden scroll-mt-5",

  guideHeader:
    "px-[30px] pt-[27px] pb-[25px] max-[1200px]:px-[23px] max-[600px]:px-[18px] max-[600px]:py-[21px] " +
    "[&>h2]:max-w-[42ch] [&>h2]:mt-[18px] [&>h2]:text-[25px] max-[600px]:[&>h2]:text-[22px] " +
    "[&>h2]:leading-[1.4] [&>h2]:font-[550] [&>h2]:tracking-[-.035em] max-[900px]:[&>h2]:scroll-mt-[25px] " +
    "[&>p]:mt-2.5 [&>p]:text-[#aaa] [&>p]:text-[13px] [&>p]:leading-[1.8] [&>p]:max-w-[65ch]",

  sourceTag:
    "flex items-center gap-2 max-[600px]:flex-wrap text-[#aaa] text-xs " +
    "[&>span+span]:ml-auto [&>span+span]:text-muted [&>span+span]:text-[10px]",

  productTags: "flex flex-wrap gap-[7px] mt-5 [&>span]:text-[#aaa] [&>span]:text-xs",

  guideSection:
    "min-w-0 px-[30px] py-6 max-[1200px]:px-[23px] max-[600px]:px-[18px] max-[600px]:py-[21px] border-t border-line " +
    "[&>h3]:flex [&>h3]:items-center [&>h3]:gap-2 [&>h3]:text-[13px] [&>h3]:mb-3 " +
    "[&>p]:text-[#c4c4c4] [&>p]:text-[14px] [&>p]:leading-[1.8] [&>p]:max-w-[75ch]",

  guidanceColumns:
    "grid grid-cols-2 max-[1200px]:grid-cols-[minmax(0,1fr)] " +
    "[&>section+section]:border-l [&>section+section]:border-l-line [&>section+section]:bg-[#131313] " +
    "max-[1200px]:[&>section+section]:border-l-0",

  checklist:
    "list-none grid gap-[14px] m-0 p-0 " +
    "[&>li]:flex [&>li]:gap-[9px] [&>li]:text-[#c4c4c4] [&>li]:text-[14px] [&>li]:leading-[1.8] " +
    "[&>li>svg]:mt-[5px] [&>li>svg]:text-accent [&>li>svg]:flex-none",

  exampleSection:
    "border-t border-line px-[30px] py-6 max-[1200px]:px-[23px] max-[600px]:px-[18px] max-[600px]:py-[21px] " +
    "[&>h3]:flex [&>h3]:items-center [&>h3]:gap-2 [&>h3]:text-[13px] [&>h3]:mb-3",

  examples:
    "grid grid-cols-2 max-[600px]:grid-cols-[minmax(0,1fr)] rounded-[9px] border border-line overflow-hidden mt-4 " +
    "[&>div]:min-w-0 [&>div]:px-[19px] [&>div]:py-[17px] [&>div]:bg-[#141414] " +
    "[&>div+div]:border-l [&>div+div]:border-l-line [&>div+div]:bg-[#15121a] " +
    "max-[600px]:[&>div+div]:border-l-0 max-[600px]:[&>div+div]:border-t max-[600px]:[&>div+div]:border-t-line " +
    "[&_p]:mt-3 [&_p]:text-[14px] [&_p]:leading-[1.85] [&_p]:text-[#ddd]",

  attentionLabel: "flex items-center gap-[7px] text-xs text-[#e3c17d]",
  exampleLabel: "flex items-center gap-[7px] text-xs text-[#bea2ea]",
  exampleNote: "text-[#aaa] text-xs leading-[1.8] mt-3",

  sourceFooter:
    "flex items-center justify-between gap-5 px-[30px] py-5 max-[1200px]:px-[23px] max-[1200px]:flex-wrap " +
    "max-[600px]:px-[18px] max-[600px]:py-[21px] border-t border-line " +
    "[&>div>h3]:text-[13px] [&>div>h3]:font-medium " +
    "[&>div>p]:max-w-[60ch] [&>div>p]:text-[#bbb] [&>div>p]:text-xs [&>div>p]:leading-[1.8] [&>div>p]:mt-1 " +
    "[&>a]:shrink-0",

  readOnly: "shrink-0 text-muted text-[10px]",
  footerNote: "text-[#888] text-[11px] max-[600px]:text-xs leading-[1.8] mt-[23px] mb-0 max-w-[100ch]",

  /* Decision log */
  outcomeTabs:
    "flex gap-[23px] border-b border-line mb-[27px] max-[600px]:gap-5 max-[600px]:overflow-x-auto max-[600px]:mb-[22px] " +
    "[&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:px-0 [&>button]:pt-0 [&>button]:pb-[14px] " +
    "max-[600px]:[&>button]:pb-3 max-[600px]:[&>button]:min-h-[44px] max-[600px]:[&>button]:text-[11px] " +
    "[&>button]:-mb-px [&>button]:border-0 [&>button]:border-b-2 [&>button]:border-b-transparent [&>button]:bg-transparent " +
    "[&>button]:text-muted [&>button]:text-xs [&>button]:whitespace-nowrap " +
    "[&>button>span]:px-1.5 [&>button>span]:rounded [&>button>span]:bg-[#202020] [&>button>span]:text-[#aaa] [&>button>span]:text-[10px] " +
    "[&>button[aria-pressed=true]]:text-[#d5b6ff] [&>button[aria-pressed=true]]:border-b-accent " +
    "[&>button[aria-pressed=true]>span]:bg-[#2c1d40] [&>button[aria-pressed=true]>span]:text-[#c9a4f5]",

  logLayout:
    "grid grid-cols-[minmax(0,.95fr)_minmax(380px,1.05fr)] gap-7 items-start " +
    "max-[1100px]:grid-cols-[minmax(0,1fr)] max-[1100px]:gap-[26px]",

  records: "min-w-0",

  refresh:
    "inline-flex items-center gap-[7px] px-0 py-[7px] max-[600px]:min-h-[44px] border-0 bg-transparent text-[#aaa] text-xs hover:text-[#eee]",

  backToList:
    "hidden max-[1100px]:inline-flex items-center gap-[7px] px-0 py-[7px] max-[600px]:min-h-[44px] border-0 bg-transparent text-[#aaa] text-xs hover:text-[#eee]",

  backToChecks:
    "hidden max-[900px]:inline-flex max-[900px]:ml-auto items-center gap-[7px] px-0 py-[7px] max-[600px]:min-h-[44px] border-0 bg-transparent text-[#aaa] text-xs hover:text-[#eee]",

  recordList: "m-0 p-0 list-none rounded-lg border border-line overflow-hidden [&>li:last-child>a]:border-b-0",

  record:
    "block w-full px-4 py-[13px] max-[600px]:px-3 max-[600px]:py-[14px] border-b border-b-line border-l-[3px] border-l-transparent bg-panel " +
    "hover:bg-[#171717] aria-[current=true]:border-l-accent aria-[current=true]:bg-[#191420]",

  recordTop:
    "flex items-baseline justify-between gap-[14px] max-[600px]:gap-[9px] " +
    "[&>strong]:text-[#e7e7e7] [&>strong]:text-[14px] [&>strong]:font-[550] [&>strong]:leading-[1.65] [&>strong]:[overflow-wrap:anywhere]",

  revision: "shrink-0 text-[#aaa] text-xs",

  recordMeta:
    "flex flex-wrap items-center gap-x-3 gap-y-[7px] max-[600px]:gap-x-[9px] mt-[7px] text-[#aaa] text-xs " +
    "[&>span:first-child]:text-[11px] [&>span:first-child]:px-[7px] [&>span:first-child]:py-0.5",

  recordFeedback:
    "block line-clamp-1 " +
    "text-[#bbb] text-xs leading-[1.65] mt-[7px] [overflow-wrap:anywhere]",

  recordBottom:
    "flex flex-wrap items-center gap-x-[14px] gap-y-1.5 mt-2 text-[#999] text-xs " +
    "[&>strong]:text-[#e0c58e] [&>strong]:text-xs [&>strong]:font-semibold",

  decisionDetail: "min-w-0 rounded-xl border border-line bg-panel overflow-hidden",

  detailHeading:
    "flex items-center justify-between gap-3 px-[23px] py-4 max-[600px]:px-[18px] bg-[#151515] border-b border-b-line " +
    "[&>h2]:flex [&>h2]:items-baseline [&>h2]:gap-4 [&>h2]:text-[13px] [&>h2]:scroll-mt-6 " +
    "max-[600px]:[&>h2]:grid max-[600px]:[&>h2]:gap-[5px] " +
    "[&>h2>span]:text-[#aaa] [&>h2>span]:text-xs [&>h2>span]:font-normal " +
    "[&>span]:text-[#999] [&>span]:text-[10px]",

  decisionSummary:
    "px-[23px] pt-6 pb-[21px] max-[600px]:px-[18px] " +
    "[&>h3]:mt-[15px] [&>h3]:text-lg [&>h3]:leading-[1.6] [&>h3]:font-[550] [&>h3]:tracking-[-.02em] [&>h3]:[overflow-wrap:anywhere] " +
    "[&>p]:text-xs [&>p]:text-[#999] [&>p]:mt-1",

  recordFacts:
    "grid grid-cols-2 gap-x-[22px] gap-y-[18px] max-[600px]:gap-x-[15px] max-[600px]:gap-y-[17px] mt-[23px] " +
    "[&>div]:min-w-0 [&_dt]:text-[#aaa] [&_dt]:text-xs [&_dt]:mb-1 " +
    "[&_dd]:text-[13px] [&_dd]:text-[#ccc] [&_dd]:[overflow-wrap:anywhere]",

  historical:
    "flex items-start gap-2.5 mt-[18px] p-3 rounded-[7px] border border-[#503d22] bg-[#211b12] " +
    "text-[#dac294] text-[13px] leading-[1.75] " +
    "[&>svg]:mt-0.5 [&>svg]:flex-none [&_strong]:block [&_strong]:mb-1",

  feedback:
    "border-t border-line px-[23px] py-5 max-[600px]:px-[18px] [&>h3]:text-[13px] [&>h3]:font-semibold " +
    "[&>p]:text-[#ccc] [&>p]:text-[14px] [&>p]:leading-[1.85] [&>p]:mt-2.5 [&>p]:whitespace-pre-wrap [&>p]:[overflow-wrap:anywhere]",

  snapshot:
    "border-t border-line px-[23px] py-5 max-[600px]:px-[18px] [&_h3]:text-[13px] [&_h3]:font-semibold " +
    "[&_blockquote]:max-h-[300px] [&_blockquote]:overflow-auto [&_blockquote]:px-4 [&_blockquote]:py-[15px] " +
    "[&_blockquote]:rounded-lg [&_blockquote]:border [&_blockquote]:border-[#2b2b2b] [&_blockquote]:bg-[#151515] " +
    "[&_blockquote]:text-[#ddd] [&_blockquote]:text-[14px] [&_blockquote]:leading-[1.9] " +
    "[&_blockquote]:whitespace-pre-wrap [&_blockquote]:[overflow-wrap:anywhere]",

  snapshotMeta: "block text-[#aaa] text-xs mt-2.5",

  checkDetails:
    "px-[23px] py-5 max-[600px]:px-[18px] border-t border-line text-[13px] text-[#bbb] " +
    "[&>h3]:text-[13px] " +
    "[&>ul]:mt-2.5 [&>ul]:mb-0 [&>ul]:p-0 [&>ul]:list-none " +
    "[&>ul>li]:flex [&>ul>li]:items-start [&>ul>li]:justify-between [&>ul>li]:gap-3 [&>ul>li]:py-2.5 " +
    "[&>ul>li]:border-b [&>ul>li]:border-b-line [&>ul>li:last-child]:border-b-0 [&>ul>li]:leading-[1.65] " +
    "[&>ul>li>span]:text-[10px] [&>ul>li>span]:mt-px " +
    "[&_a]:underline [&_a]:decoration-[#555] [&_a]:underline-offset-[3px] hover:[&_a]:text-[#d5b6ff] hover:[&_a]:decoration-current " +
    "[&>p]:text-[#aaa] [&>p]:text-xs [&>p]:leading-[1.8] [&>p]:mt-[13px]",

  reviewReasons:
    "mt-5 pt-5 border-t border-line " +
    "[&>ol]:list-none [&>ol]:mt-3 [&>ol]:mb-0 [&>ol]:p-0 " +
    "[&_li]:border-l-2 [&_li]:border-l-[#58416e] [&_li]:pl-3 [&_li+li]:mt-[18px] " +
    "[&_p]:text-[#ddd] [&_p]:text-[13px] [&_p]:leading-[1.8] [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere] " +
    "[&_time]:block [&_time]:mt-[5px] [&_time]:text-[#aaa] [&_time]:text-xs",

  copyStatus: "w-full text-xs text-[#bbb] [overflow-wrap:anywhere]",

  decisionFooter:
    "flex flex-wrap items-center gap-3 border-t border-line px-[23px] py-[17px] max-[600px]:px-[18px] " +
    "[&>span]:text-[#888] [&>span]:text-[10px] " +
    "[&>a]:text-xs [&>button]:text-xs max-[600px]:[&>a]:flex-auto max-[600px]:[&>button]:flex-auto",

  /* Shared states */
  empty:
    "grid justify-items-center gap-[15px] px-6 py-[65px] rounded-[13px] border border-line bg-panel text-muted text-center " +
    "[&>h2]:text-[19px] [&>p]:text-[13px] [&>p]:max-w-[55ch] [&>a]:mt-1.5 [&>button]:mt-1.5",

  loading:
    "grid grid-cols-1 gap-[15px] p-[26px] rounded-xl border border-line " +
    "[&>div]:h-[75px] [&>div]:bg-raised [&>div]:rounded-[7px] [&>div]:animate-[reference-pulse_1.7s_ease-in-out_infinite] " +
    "[&>div:first-of-type]:w-[65%] [&>div:first-of-type]:h-[23px] [&>div:last-child]:w-[85%] " +
    "motion-reduce:[&>div]:animate-none motion-reduce:[&>div]:opacity-65",
} as const;
