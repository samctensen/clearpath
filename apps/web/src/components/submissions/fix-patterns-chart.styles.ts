import type { FixPatternSource } from "@clearpath/contracts";

/**
 * Tailwind class map for the "What needs input" chart.
 *
 * `--reason-color` carries the per-reason hue, and the label/count/gap widths are
 * custom properties so the axis, bands and skeleton rows stay on one grid.
 */
export const styles = {
  panel:
    "[--reason-color:var(--color-muted)] [--label-width:218px] [--count-width:44px] [--column-gap:24px] " +
    "max-[900px]:[--label-width:175px] max-[900px]:[--column-gap:18px] " +
    "max-[600px]:[--count-width:32px] max-[600px]:[--column-gap:12px] " +
    "min-w-0 mb-6 p-5 max-[600px]:px-[14px] max-[600px]:py-[18px] rounded-[14px] border border-line bg-panel",

  heading:
    "flex items-start justify-between gap-4 max-[600px]:gap-2 mb-[18px] " +
    "[&_h2]:text-xl max-[600px]:[&_h2]:text-lg [&_h2]:leading-[1.2] [&_h2]:font-[550] [&_h2]:tracking-[-.035em] " +
    "[&_p]:mt-1 [&_p]:text-muted [&_p]:text-xs max-[600px]:[&_p]:max-w-[25ch] max-[600px]:[&_p]:text-[11px] " +
    "[&_p_strong]:text-ink [&_p_strong]:font-medium",

  scope:
    "flex-none pt-1 text-muted text-[11px] " +
    "max-[600px]:max-w-[8ch] max-[600px]:text-[10px] max-[600px]:leading-[1.5] max-[600px]:text-right",

  axis:
    "grid grid-cols-[var(--label-width)_minmax(0,1fr)_var(--count-width)] gap-x-[var(--column-gap)] items-center " +
    "px-[13px] pb-[5px] text-muted text-[10px] " +
    "max-[600px]:grid-cols-[minmax(0,1fr)_var(--count-width)] max-[600px]:px-[11px]",

  axisLabel: "text-[11px] max-[600px]:col-span-full max-[600px]:mb-2 max-[600px]:text-[10px]",

  scale:
    "relative h-[14px] [font-variant-numeric:tabular-nums] max-[600px]:col-start-1 " +
    "[&>span]:absolute [&>span]:-translate-x-1/2",

  countLabel: "text-right max-[600px]:col-start-2",

  chart: "list-none m-0 p-0 data-[has-selection=true]:[&_[aria-pressed=false]_.fp-fill]:opacity-[.64]",

  reason: "[&+&]:mt-px",

  band:
    "relative grid grid-cols-[var(--label-width)_minmax(0,1fr)_var(--count-width)] gap-x-[var(--column-gap)] items-center " +
    "w-full min-h-[54px] px-3 py-[7px] rounded-lg border border-transparent bg-transparent text-ink text-left " +
    "transition-[background-color,border-color] duration-[180ms] ease-out motion-reduce:transition-none " +
    "max-[600px]:grid-cols-[minmax(0,1fr)_var(--count-width)] max-[600px]:gap-y-1.5 max-[600px]:min-h-[86px] " +
    "max-[600px]:px-2.5 max-[600px]:py-2 " +
    "before:absolute before:inset-y-3 before:-left-px before:w-0.5 before:rounded-sm before:bg-[var(--reason-color)] " +
    "before:content-[''] before:opacity-0 before:scale-y-[.6] " +
    "before:transition-[opacity,transform] before:duration-[180ms] before:ease-out motion-reduce:before:transition-none " +
    "hover:bg-[#ffffff04] " +
    "aria-[pressed=true]:border-[#513177] aria-[pressed=true]:bg-[#21152f] " +
    "aria-[pressed=true]:before:opacity-100 aria-[pressed=true]:before:scale-y-100 " +
    "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 focus-visible:z-[1] " +








    "aria-[pressed=true]:[&_.fp-fill]:bg-[color-mix(in_srgb,var(--reason-color)_23%,transparent)] " +
    "hover:[&_.fp-fill]:!opacity-100 focus-visible:[&_.fp-fill]:!opacity-100 " +
    "data-[zero=true]:[&_.fp-fill]:hidden data-[zero=true]:[&_strong]:text-muted",

  category: "grid min-w-0 gap-[3px] max-[600px]:col-span-full",

  label: "text-[13px] max-[900px]:text-xs font-medium leading-[1.45] [overflow-wrap:anywhere]",

  source: "flex items-center gap-1.5 text-muted text-[11px] leading-[1.4]",

  sourceMark:
    "fp-mark flex-none inline-block w-1.5 h-1.5 bg-[var(--reason-color)] rounded-[1px]",




  plot: "relative block h-8 max-[600px]:col-start-1 max-[600px]:h-[25px]",

  grid:
    "absolute -inset-y-[7px] inset-x-0 pointer-events-none max-[600px]:-inset-y-1 " +
    "[&>i]:absolute [&>i]:inset-y-0 [&>i]:w-px [&>i]:bg-[#ffffff0b] [&>i:first-child]:bg-[#ffffff1c]",

  /* The texture distinguishes a missing detail from a recorded reviewer request. */
  fill:
    "fp-fill absolute inset-y-[5px] left-0 right-auto max-[600px]:inset-y-[3px] " +
    "border-y border-y-[color-mix(in_srgb,var(--reason-color)_42%,transparent)] rounded-l-sm " +
    "bg-[color-mix(in_srgb,var(--reason-color)_16%,transparent)] " +
    "transition-[width,opacity,background-color] duration-[220ms] ease-out motion-reduce:transition-none",


  cap: "absolute -inset-y-[3px] -right-px left-auto w-[3px] bg-[var(--reason-color)] rounded-[1px]",

  count:
    "text-right text-[23px] max-[600px]:text-[21px] max-[600px]:col-start-2 leading-none font-medium " +
    "tracking-[-.06em] [font-variant-numeric:tabular-nums]",

  chartFooter:
    "flex items-center flex-wrap gap-x-4 gap-y-1 min-h-9 mt-0.5 text-muted text-[11px] " +
    "max-[600px]:gap-x-3 max-[600px]:gap-y-0 max-[600px]:mt-3 max-[600px]:text-[10px] " +
    "[&>p]:mr-auto max-[600px]:[&>p]:basis-full",

  expand:
    "inline-flex min-h-[44px] items-center justify-center gap-2.5 px-0.5 py-1.5 border-0 bg-transparent " +
    "text-[#c7a5ff] text-[11px] hover:text-[#e0cdff]",

  chevron:
    "w-1.5 h-1.5 -mt-[3px] border-r border-b border-current rotate-45 " +
    "transition-transform duration-[180ms] ease-out motion-reduce:transition-none " +
    "data-[expanded=true]:translate-y-[3px] data-[expanded=true]:rotate-[225deg]",

  keptVisible: "basis-full pb-2",

  context:
    "flex items-center justify-between gap-6 min-h-[60px] mt-0 pt-3 border-t border-t-line " +
    "max-[600px]:items-start max-[600px]:flex-col max-[600px]:gap-3 max-[600px]:mt-3",

  explanation:
    "min-w-0 text-xs [&>strong]:font-medium [&>strong]:text-[#c9c9c9] " +
    "[&_p]:max-w-[86ch] [&_p]:mt-1 [&_p]:text-muted [&_p]:text-[11px] [&_p]:leading-[1.65]",

  contextHeading:
    "flex flex-wrap items-center gap-x-2 gap-y-1 [&_strong]:font-medium " +
    "[&>span:last-child]:text-muted [&>span:last-child]:text-[11px]",

  action:
    "flex-none min-h-[44px] px-[14px] py-[9px] rounded-lg border border-[#55377a] bg-[#28163e] " +
    "text-[#d8bfff] text-xs font-medium hover:border-[#8052b4] hover:bg-[#341d4e]",

  state:
    "grid justify-items-start content-center gap-2 min-h-[178px] pt-2 pb-6 " +
    "[&_h3]:text-base [&_h3]:font-medium " +
    "[&_p]:max-w-[70ch] [&_p]:text-muted [&_p]:text-xs [&_p]:[overflow-wrap:anywhere] " +
    "[&_button]:mt-1.5 [&_a]:mt-1.5",

  loadingLabel: "block mb-2 text-muted text-[11px]",
  skeletonRows: "pb-7",

  skeletonRow:
    "grid grid-cols-[var(--label-width)_minmax(0,1fr)_var(--count-width)] gap-x-[var(--column-gap)] items-center " +
    "min-h-[55px] px-3 py-[7px] " +
    "max-[600px]:grid-cols-[minmax(0,1fr)_var(--count-width)] max-[600px]:gap-y-1.5 max-[600px]:min-h-[87px] " +
    "[&>span]:h-[30px] [&>span]:w-[80%] [&>span]:rounded-[3px] [&>span]:bg-[#ffffff07] " +
    "max-[600px]:[&>span]:col-span-full max-[600px]:[&>span]:w-[45%] " +
    "[&>i]:h-[30px] [&>i]:border-y [&>i]:border-y-[#ffffff0b] [&>i]:bg-[#ffffff06] " +
    "[&>b]:w-[18px] [&>b]:h-6 [&>b]:justify-self-end [&>b]:rounded-[3px] [&>b]:bg-[#ffffff07]",
} as const;

/** The hue each reason carries; set as `--reason-color` on the band. */
export const reasonColor: Record<FixPatternSource, string> = {
  missing_information: "var(--color-info)",
  reviewer_request: "var(--color-waiting)",
  unavailable: "#b3b3b3",
};

/** Texture, not just hue, separates a missing detail from a recorded request. */
export const fillTexture: Record<FixPatternSource, string> = {
  missing_information:
    "[background-image:repeating-linear-gradient(125deg,transparent_0_4px,color-mix(in_srgb,var(--reason-color)_54%,transparent)_4px_5px,transparent_5px_8px)]",
  reviewer_request:
    "[background-image:radial-gradient(circle,color-mix(in_srgb,var(--reason-color)_76%,transparent)_.8px,transparent_1px)] [background-size:5px_5px] [background-position:1px_1px]",
  unavailable:
    "[background-image:repeating-linear-gradient(0deg,transparent_0_5px,#ffffff26_5px_6px)]",
};

/** The mark repeats the distinction at legend size: square, dot, or outline. */
export const markShape: Record<FixPatternSource, string> = {
  missing_information: "",
  reviewer_request: "rounded-full",
  unavailable: "bg-transparent border border-[var(--reason-color)]",
};
