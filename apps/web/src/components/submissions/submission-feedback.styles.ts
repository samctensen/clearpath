/** Tailwind class map for reviewer feedback and change-request content. */
export const styles = {
  feedback:
    "p-5 mb-5 rounded-xl border border-line bg-panel " +
    "[&_h2]:mt-0 [&_h2]:mb-[14px] [&_h2]:text-base " +
    "[&_h3]:mt-0 [&_h3]:mb-2 [&_h3]:text-[.9rem] " +
    "[&_p]:my-1.5 [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere]",

  entry: "[&+&]:mt-[18px] [&+&]:pt-4 [&+&]:border-t [&+&]:border-t-line",

  concerns:
    "mt-[18px] pt-4 border-t border-t-line " +
    "[&_ul]:pl-5 [&_ul]:mb-0 [&_li+li]:mt-[14px] " +
    "[&_blockquote]:my-2 [&_blockquote]:pl-3 [&_blockquote]:border-l-2 [&_blockquote]:border-l-accent " +
    "[&_blockquote]:[overflow-wrap:anywhere]",

  emptyFeedback: "mt-0 mx-0 mb-[18px] text-muted text-[13px] leading-[1.6]",

  missingList:
    "list-none mt-4 mx-0 mb-0 p-0 " +
    "[&_li+li]:mt-4 [&_li+li]:pt-4 [&_li+li]:border-t [&_li+li]:border-t-line",

  checkHeading:
    "flex items-start justify-between flex-wrap gap-x-[14px] gap-y-2 [&_strong]:text-[14px]",

  requestContent: "min-w-0 [overflow-wrap:anywhere] [&_p]:whitespace-pre-wrap",

  requestItems:
    "list-none p-0 mt-4 mx-0 mb-0 " +
    "[&_li+li]:mt-4 [&_li+li]:pt-4 [&_li+li]:border-t [&_li+li]:border-t-line " +
    "[&_blockquote]:my-2.5 [&_blockquote]:pl-3 [&_blockquote]:border-l-2 [&_blockquote]:border-l-accent " +
    "[&_blockquote]:whitespace-pre-wrap [&_blockquote]:[overflow-wrap:anywhere]",

  requestExplanation:
    "mt-2 text-muted " +
    "[&>summary]:w-fit [&>summary]:py-1.5 [&>summary]:cursor-pointer " +
    "max-[600px]:[&>summary]:min-h-[44px] max-[600px]:[&>summary]:py-3",
} as const;
