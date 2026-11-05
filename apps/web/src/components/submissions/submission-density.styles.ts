/**
 * Mobile density override for a journey holding a single event: below 600px that one
 * event collapses to a compact row instead of a full timeline entry.
 */
export const density = {
  singleHistory: "max-[600px]:mt-3",

  singleTimeline:
    "max-[600px]:mt-2.5 " +
    "max-[600px]:[&>li]:pb-0 " +
    "max-[600px]:[&>li>a]:items-start max-[600px]:[&>li>a]:min-h-[44px] " +
    "max-[600px]:[&>li>a>span:first-child]:mt-[3px] " +
    "max-[600px]:[&>li>a>span:last-child]:flex-row max-[600px]:[&>li>a>span:last-child]:flex-wrap " +
    "max-[600px]:[&>li>a>span:last-child]:gap-x-[9px] max-[600px]:[&>li>a>span:last-child]:gap-y-[3px] " +
    "max-[600px]:[&_time]:basis-full",
} as const;
