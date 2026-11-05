/** Tailwind class map for the dashboard's loading skeletons. */
export const styles = {
  block: "block w-full h-2.5 rounded bg-[#292929] animate-[breathe_1.8s_ease-in-out_infinite] motion-reduce:animate-none",

  map: "@container min-w-0 overflow-hidden rounded-[14px] border border-line bg-panel",

  heading:
    "grid gap-1 px-[18px] pt-[14px] pb-3 @max-[700px]:p-[14px] " +
    "[&>h2]:m-0 [&>h2]:text-lg [&>h2]:font-medium [&>h2]:tracking-[-.03em] [&>h2]:leading-[1.2] " +
    "[&>p]:text-muted [&>p]:text-[12.5px] [&>p]:leading-[1.5]",

  graph:
    "flex items-center min-h-[196px] px-[18px] py-2.5 @max-[700px]:p-3 @max-[340px]:px-2 " +
    "border-y border-y-line bg-canvas",

  origin:
    "grid place-items-center flex-[0_0_46px] h-[46px] rounded-[14px] border border-line bg-panel " +
    "@max-[700px]:flex-[0_0_36px] @max-[700px]:h-9 @max-[700px]:rounded-[11px] " +
    "@max-[340px]:flex-[0_0_30px] @max-[340px]:h-8 " +
    "[&>span]:!w-[18px] [&>span]:!h-[14px]",

  branches:
    "relative flex-1 min-w-0 " +
    "[&>svg]:absolute [&>svg]:inset-0 [&>svg]:w-[calc(100%-186px)] [&>svg]:h-[176px] [&>svg]:overflow-visible " +
    "@max-[700px]:[&>svg]:w-[calc(100%-142px)] @max-[340px]:[&>svg]:w-[calc(100%-126px)]",

  path: "fill-none stroke-[#303030] stroke-[1.5] [vector-effect:non-scaling-stroke]",

  trace:
    "fill-none stroke-[#6a548e] stroke-[1.5] [stroke-linecap:round] [stroke-dasharray:6_100] [vector-effect:non-scaling-stroke] " +
    "animate-[trace_3s_linear_infinite] motion-reduce:hidden",

  destinations:
    "grid grid-rows-[repeat(4,44px)] w-[186px] ml-auto @max-[700px]:w-[142px] @max-[340px]:w-[126px] " +
    "[&>button]:flex [&>button]:items-center [&>button]:justify-between [&>button]:gap-2.5 [&>button]:min-w-0 " +
    "[&>button]:my-1 [&>button]:px-2.5 @max-[700px]:[&>button]:px-2 @max-[340px]:[&>button]:px-1.5 " +
    "@max-[700px]:[&>button]:gap-1.5 [&>button]:rounded-lg [&>button]:border [&>button]:border-transparent " +
    "[&>button]:bg-canvas [&>button]:text-muted [&>button]:text-[13px] @max-[700px]:[&>button]:text-xs " +
    "@max-[340px]:[&>button]:text-[11.5px] [&>button]:font-medium [&>button]:text-left " +
    "hover:[&>button]:bg-raised hover:[&>button]:text-ink " +
    "[&>button[aria-pressed=true]]:border-[#64517e] [&>button[aria-pressed=true]]:bg-[#1c1723] [&>button[aria-pressed=true]]:text-ink " +
    "[&_i]:flex-[0_0_18px] [&_i]:!h-3",

  mapFooter:
    "flex items-center gap-2 min-h-[103px] p-[18px] @max-[700px]:min-h-[76px] @max-[700px]:p-[14px] text-muted text-xs",

  loadingDot:
    "w-1.5 h-1.5 flex-none rounded-full bg-accent animate-[breathe_1.8s_ease-in-out_infinite] motion-reduce:animate-none",

  unavailable:
    "flex flex-col items-center justify-center gap-2.5 min-h-[299px] @max-[700px]:min-h-[230px] p-6 " +
    "border-t border-t-line text-muted text-[13px] text-center",

  next: "col-span-full min-[1001px]:max-[1280px]:grid min-[1001px]:max-[1280px]:grid-cols-3 min-[1001px]:max-[1280px]:gap-4",

  nextRow:
    "grid gap-2.5 min-h-[63px] content-center py-[13px] border-b border-b-line last:border-0 " +
    "min-[1001px]:max-[1280px]:border-0 " +
    "nth-2:[&_span]:[animation-delay:120ms] nth-3:[&_span]:[animation-delay:240ms] nth-3:[&>span:first-child]:!max-w-[70%]",

  title: "!max-w-[85%] !h-[11px]",
  detail: "!max-w-[58%] !h-2",

  rows:
    "[&_span]:my-[5px] max-[650px]:[&_tr]:min-h-[170px] " +
    "[&_tr:nth-child(2)_span]:[animation-delay:120ms] [&_tr:nth-child(3)_span]:[animation-delay:240ms] [&_tr:nth-child(4)_span]:[animation-delay:360ms]",

  campaign: "!w-[85%] !max-w-[260px] !h-[11px]",
  publisher: "!w-[58%] !max-w-[150px] !h-2",
  product: "!w-[94px] !max-w-full",
  short: "!w-[72px] !max-w-full",
  pill: "!w-[126px] !max-w-full !h-[25px] !rounded-[99px]",
} as const;
