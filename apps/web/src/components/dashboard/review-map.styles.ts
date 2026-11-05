/**
 * Tailwind class map for the review map.
 *
 * `--status-width`, `--status-height` and `--compact-map` are declared on the panel and
 * re-declared per container width; the component reads them back with getComputedStyle
 * to lay out the SVG, so they must stay real custom properties rather than utilities.
 */
export const styles = {
  panel:
    "@container [--status-width:196px] [--status-height:36px] [--compact-map:0] " +
    "flex flex-col min-w-0 bg-panel border border-line rounded-[14px] overflow-hidden text-ink",

  ready: "[--status:var(--color-ready)]",
  info: "[--status:var(--color-info)]",
  waiting: "[--status:var(--color-waiting)]",
  approved: "[--status:var(--color-approved)]",

  header:
    "flex flex-wrap items-end justify-between gap-x-5 gap-y-2 px-[18px] pt-[14px] pb-3 @max-[700px]:p-[14px]",

  titleBlock: "grid gap-1 min-w-0",
  title: "m-0 text-lg font-medium tracking-[-.03em] leading-[1.2]",
  subtitle: "m-0 text-muted text-[12.5px] leading-[1.5]",
  summary: "m-0 text-muted text-[12.5px] font-medium whitespace-nowrap @max-[700px]:whitespace-normal",

  /* Diagram: 4 rows x 44px; the SVG field shares that geometry. */
  diagram:
    "flex items-stretch pl-[18px] pr-2.5 py-2.5 bg-canvas border-t border-t-line " +
    "@max-[700px]:[--status-width:142px] @max-[700px]:[--status-height:44px] @max-[700px]:[--compact-map:1] @max-[700px]:p-3 " +
    "@max-[380px]:[--status-width:114px] @max-[380px]:px-2",

  origin:
    "relative flex flex-[0_0_64px] flex-col items-end justify-center pr-[14px] text-right " +
    "@max-[700px]:flex-[0_0_44px] @max-[700px]:pr-2 @max-[380px]:flex-[0_0_24px] @max-[380px]:pr-0",

  originCount:
    "grid place-items-center w-[46px] h-[46px] rounded-[14px] border border-line bg-panel " +
    "shadow-[inset_0_1px_0_#ffffff08] text-[22px] font-medium leading-none " +
    "@max-[700px]:w-9 @max-[700px]:h-9 @max-[700px]:rounded-[11px] @max-[700px]:text-[19px] " +
    "@max-[380px]:w-6 @max-[380px]:h-[30px] @max-[380px]:rounded-[9px] @max-[380px]:text-[15px]",

  originLabel:
    "absolute top-[calc(50%+30px)] right-[14px] w-[46px] text-center text-muted text-xs leading-[1.3] " +
    "@max-[700px]:top-[calc(50%+25px)] @max-[700px]:right-2 @max-[700px]:w-9 @max-[700px]:text-[10px] " +
    "@max-[380px]:right-0 @max-[380px]:w-6",

  originNode:
    "absolute top-1/2 -right-1 w-[9px] h-[9px] border-[1.5px] border-muted rounded-sm bg-canvas -translate-y-1/2 " +
    "@max-[700px]:w-[7px] @max-[700px]:h-[7px] @max-[700px]:-right-[3px]",

  network: "relative flex-1 min-w-0",

  field:
    "absolute top-0 left-0 w-[calc(100%-var(--status-width))] h-[176px] block overflow-visible pointer-events-none",

  branchGroup: "opacity-80 transition-opacity duration-[180ms] ease-out motion-reduce:transition-none",
  branch:
    "fill-none stroke-[var(--status)] [stroke-linecap:round] stroke-[1.5] " +
    "transition-[stroke-width] duration-[180ms] ease-out motion-reduce:transition-none",
  branchHalo:
    "fill-none stroke-[var(--status)] [stroke-linecap:round] stroke-[8] opacity-0 " +
    "transition-opacity duration-[180ms] ease-out motion-reduce:transition-none",
  branchActive: "!opacity-100 [&_.map-branch]:stroke-2 [&_.map-halo]:!opacity-[.13]",
  branchSelected: "!opacity-100 [&_.map-branch]:stroke-2 [&_.map-halo]:!opacity-[.13]",
  branchTrace:
    "fill-none stroke-[var(--status)] stroke-[3.5] [stroke-linecap:round] [stroke-dasharray:1] " +
    "animate-[traceBranch_900ms_cubic-bezier(.2,.65,.3,1)_both] motion-reduce:animate-none motion-reduce:opacity-0",
  branchHit: "fill-none stroke-transparent stroke-[24] [pointer-events:stroke] cursor-pointer",
  branchEmpty:
    "!opacity-100 [&_.map-branch]:!stroke-line [&_.map-branch]:[stroke-dasharray:2_4] [&_.map-halo]:hidden",
  branchDim: "!opacity-40",

  particleField:
    "absolute inset-0 z-[2] w-full h-[176px] overflow-visible pointer-events-none motion-reduce:hidden",

  particle:
    "fill-none stroke-[color-mix(in_srgb,var(--status)_85%,white)] stroke-[1.5] [stroke-linecap:round] " +
    "[stroke-dasharray:.65_200] [filter:drop-shadow(0_0_2px_color-mix(in_srgb,var(--status)_65%,transparent))] " +
    "animate-[travelBranch_14s_linear_infinite] motion-reduce:animate-none",

  rows: "pointer-events-none relative grid grid-rows-[repeat(4,44px)] min-w-0",

  row:
    "grid grid-cols-[minmax(0,1fr)_var(--status-width)] items-center min-w-0 " +
    "transition-opacity duration-[180ms] ease-out motion-reduce:transition-none",

  rowActive: "",
  rowDim: "[&_.map-track]:opacity-75 focus-within:[&_.map-track]:opacity-100 hover:[&_.map-track]:opacity-100",

  track:
    "map-track relative flex items-center justify-evenly gap-0.5 min-w-0 h-full pl-[32%] pr-1.5 " +
    "@max-[700px]:gap-0 @max-[700px]:pr-1",

  token:
    "pointer-events-auto relative z-[1] grid place-items-center flex-none w-6 h-6 p-0 border-0 rounded-md " +
    "bg-transparent cursor-pointer @max-[700px]:w-11 @max-[700px]:h-11 " +
    "before:content-[''] before:w-2.5 before:h-2.5 @max-[700px]:before:w-2 @max-[700px]:before:h-2 " +
    "before:rounded-sm before:bg-[var(--status)] " +
    "before:shadow-[0_0_0_3px_var(--color-canvas),0_0_0_4px_color-mix(in_srgb,var(--status)_25%,transparent)] " +
    "before:transition-[transform,box-shadow] before:duration-[160ms] before:ease-out motion-reduce:before:transition-none " +
    "hover:before:scale-120 " +
    "focus-visible:outline-2 focus-visible:outline-[var(--status)] focus-visible:outline-offset-1",

  tokenActive:
    "before:!scale-130 " +
    "before:!shadow-[0_0_0_2.5px_var(--color-canvas),0_0_0_4px_var(--color-ink),0_0_14px_color-mix(in_srgb,var(--status)_35%,transparent)]",

  more:
    "pointer-events-auto relative z-[1] flex-none ml-1 px-2 py-[3px] rounded-[99px] border border-line bg-panel " +
    "text-ink text-xs font-semibold leading-[1.4] whitespace-nowrap cursor-pointer " +
    "transition-[border-color] duration-150 ease-out motion-reduce:transition-none hover:border-muted " +
    "@max-[700px]:grid @max-[700px]:place-items-center @max-[700px]:w-11 @max-[700px]:h-11 @max-[700px]:m-0 " +
    "@max-[700px]:p-0 @max-[700px]:border-0 @max-[700px]:bg-transparent @max-[700px]:text-center @max-[700px]:text-[11px] " +
    "@max-[700px]:before:content-[''] @max-[700px]:before:absolute @max-[700px]:before:inset-y-[9px] @max-[700px]:before:inset-x-1 " +
    "@max-[700px]:before:-z-[1] @max-[700px]:before:border @max-[700px]:before:border-line " +
    "@max-[700px]:before:rounded-[99px] @max-[700px]:before:bg-panel " +
    "@max-[700px]:hover:before:border-muted",

  none: "relative z-[1] px-2 bg-canvas text-muted text-xs @max-[700px]:hidden",

  status:
    "relative pointer-events-auto flex items-center justify-between gap-2.5 min-w-0 h-[var(--status-height)] " +
    "px-3 rounded-lg border border-transparent bg-transparent text-ink text-left leading-[34px] " +
    "transition-[background-color,border-color] duration-150 ease-out motion-reduce:transition-none " +
    "@max-[700px]:gap-1.5 @max-[700px]:px-2 @max-[700px]:leading-[1.2] @max-[380px]:px-1.5 " +
    "hover:bg-[color-mix(in_srgb,var(--status)_6%,var(--color-canvas))] " +
    "aria-[pressed=true]:bg-[color-mix(in_srgb,var(--status)_10%,var(--color-canvas))] aria-[pressed=true]:border-[var(--status)] " +
    "focus-visible:outline-[var(--status)]",

  statusLabel:
    "overflow-hidden text-[13px] font-medium text-ellipsis whitespace-nowrap " +
    "@max-[700px]:overflow-visible @max-[700px]:whitespace-normal @max-[700px]:text-xs @max-[380px]:text-[11.5px]",

  statusCount:
    "grid place-items-center flex-none min-w-[25px] h-[25px] px-[5px] rounded-[7px] " +
    "border border-[color-mix(in_srgb,var(--status)_35%,transparent)] " +
    "bg-[color-mix(in_srgb,var(--status)_12%,var(--color-canvas))] text-[var(--status)] " +
    "text-[13px] font-semibold [font-variant-numeric:tabular-nums] leading-none " +
    "@max-[700px]:min-w-[22px] @max-[700px]:h-[22px] @max-[700px]:px-1 @max-[700px]:text-xs @max-[700px]:rounded-md",

  /* The inspector stays outside the diagram, reachable by keyboard and touch. */
  inspector:
    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 min-h-[92px] px-[18px] py-3 " +
    "border-t border-t-line bg-raised " +
    "@max-[700px]:flex @max-[700px]:flex-col @max-[700px]:items-stretch @max-[700px]:gap-3 @max-[700px]:p-[14px]",

  record: "contents @max-[700px]:block",

  recordTitle:
    "col-start-1 row-start-1 flex items-start gap-[9px] m-0 " +
    "[&_strong]:min-w-0 [&_strong]:[overflow-wrap:anywhere] [&_strong]:text-[14px] [&_strong]:font-medium [&_strong]:leading-[1.4] " +
    "@max-[700px]:[&_strong]:whitespace-normal",

  recordDot: "mt-[5px] flex-none w-2 h-2 rounded-sm bg-[var(--status)]",

  meta:
    "col-span-full row-start-2 flex flex-wrap gap-x-[22px] gap-y-1.5 mt-0 mr-0 mb-0 ml-[17px] " +
    "@max-[700px]:mx-0 @max-[700px]:mt-2 @max-[700px]:gap-x-[18px] @max-[700px]:gap-y-2 " +
    "[&_div]:min-w-0 [&_dt]:text-muted [&_dt]:text-[11.5px] [&_dt]:leading-[1.4] " +
    "[&_dd]:m-0 [&_dd]:text-ink [&_dd]:text-[12.5px] [&_dd]:leading-[1.45] [&_dd]:[overflow-wrap:anywhere]",

  open:
    "col-start-2 row-start-1 inline-flex flex-none items-center gap-[7px] min-h-9 px-3 rounded-[9px] " +
    "border border-line text-ink text-[12.5px] font-semibold whitespace-nowrap " +
    "transition-[border-color] duration-150 ease-out motion-reduce:transition-none hover:border-accent " +
    "@max-[700px]:justify-center @max-[700px]:min-h-[44px]",

  inspectorEmpty: "m-0 text-muted text-[13px]",
} as const;
