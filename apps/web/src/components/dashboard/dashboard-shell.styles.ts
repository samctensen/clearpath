/** Tailwind class map for the app shell: sidebar, brand, navigation and identity menu. */
export const styles = {
  shell:
    "[color-scheme:dark] grid grid-cols-[196px_minmax(0,1fr)] max-[960px]:grid-cols-[minmax(0,1fr)] min-h-screen " +
    "bg-canvas text-ink font-sans font-normal [font-variant-numeric:tabular-nums] antialiased " +
    "[&_:is(h1,h2,h3,h4)]:text-ink [&_:is(h1,h2,h3,h4)]:font-medium [&_:is(h1,h2,h3,h4)]:tracking-[-.035em] " +
    "[&_::selection]:bg-[#6d28d966] [&_::selection]:text-ink",

  skip:
    "fixed z-20 top-3 left-3 px-[14px] py-[9px] rounded-lg border border-accent bg-canvas text-ink font-semibold " +
    "-translate-y-[170%] focus:translate-y-0",

  sidebar:
    "sticky top-0 flex flex-col h-dvh pt-[14px] pb-5 bg-canvas border-r border-r-line " +
    "max-[960px]:relative max-[960px]:z-30 max-[960px]:h-auto max-[960px]:px-5 max-[960px]:py-[7px] " +
    "max-[960px]:border-r-0 max-[960px]:border-b max-[960px]:border-b-line " +
    "max-[600px]:px-[14px] max-[600px]:py-[5px]",

  brandRow: "max-[960px]:flex max-[960px]:items-center max-[960px]:justify-between max-[960px]:gap-5",

  brand: "flex items-center gap-2.5 mx-[18px] max-[960px]:mx-0 text-ink",

  navigationTrigger:
    "hidden max-[960px]:grid place-items-center w-11 h-11 p-0 rounded-[9px] border border-transparent bg-transparent text-muted " +
    "hover:bg-raised hover:border-line hover:text-ink " +
    "aria-expanded:bg-raised aria-expanded:border-line aria-expanded:text-ink",

  mark: "flex-none",
  markFrame: "fill-canvas stroke-line",
  markPath: "fill-none stroke-ink stroke-2 [stroke-linejoin:round]",
  markHead: "fill-none stroke-accent stroke-2 [stroke-linejoin:round] [stroke-linecap:round]",
  markStart: "fill-accent",

  brandText: "grid gap-[3px] min-w-0",
  wordmark: "text-[17px] font-medium tracking-[-.045em] leading-none text-ink [&_b]:font-bold [&_b]:text-ink",
  caption: "text-muted text-[10px] font-normal tracking-normal whitespace-nowrap max-[600px]:hidden",

  nav:
    "grid gap-1 mt-7 px-2.5 " +
    "max-[960px]:hidden max-[960px]:absolute max-[960px]:top-[calc(100%+6px)] max-[960px]:right-[14px] max-[960px]:left-[14px] " +
    "max-[960px]:m-0 max-[960px]:p-[7px] max-[960px]:rounded-xl max-[960px]:border max-[960px]:border-[#333] " +
    "max-[960px]:bg-panel max-[960px]:shadow-[0_16px_36px_#0009] " +
    "max-[960px]:data-[open=true]:grid",

  navLink:
    "relative flex items-center gap-[11px] min-h-10 px-2.5 py-[9px] rounded-lg text-muted text-[13px] font-medium " +
    "transition-[color,background-color] duration-150 " +
    "max-[960px]:min-h-[46px] max-[960px]:px-3 max-[960px]:py-2.5 max-[960px]:text-[14px] " +
    "hover:text-ink hover:bg-raised " +
    "aria-[current=page]:text-ink aria-[current=page]:bg-raised aria-[current=page]:font-semibold " +
    "aria-[current=page]:[&_svg]:text-accent aria-[current=page]:[&_svg]:opacity-100",

  navIcon: "flex-none opacity-75",

  demo:
    "mt-auto px-[18px] max-[960px]:hidden text-muted text-[11px] leading-[1.5] " +
    "[&_p]:m-0 [&_strong]:block [&_span]:block " +
    "[&_strong]:mb-0.5 [&_strong]:text-ink [&_strong]:text-[11px] [&_strong]:font-medium [&_strong]:tracking-normal",

  body: "min-w-0",

  userMenu: "relative",

  userTrigger:
    "inline-flex items-center justify-center w-10 h-10 p-0 rounded-full border border-line bg-raised text-ink " +
    "text-[12.5px] font-semibold transition-[border-color,background-color] duration-150 " +
    "hover:border-[#363636] hover:bg-[#242424] " +
    "aria-expanded:border-accent " +
    "aria-[expanded=false]:focus-visible:outline-none aria-[expanded=false]:focus-visible:border-muted",

  userPanel:
    "absolute z-[15] top-[calc(100%+8px)] right-0 grid gap-3 w-[272px] max-w-[calc(100vw-28px)] p-[14px] " +
    "rounded-[14px] border border-line bg-panel shadow-[0_16px_40px_#00000080]",

  roleControl: "grid gap-2",
  roleLabel: "text-muted text-[11px] font-medium tracking-normal whitespace-nowrap",

  roleOptions:
    "grid grid-cols-2 gap-1 p-[3px] rounded-[10px] border border-line bg-canvas " +
    "[&>button]:min-h-[34px] [&>button]:px-2.5 [&>button]:py-1 [&>button]:border-0 [&>button]:rounded-lg " +
    "[&>button]:bg-transparent [&>button]:text-muted [&>button]:text-[12.5px] [&>button]:font-semibold " +
    "[&>button]:transition-[color,background-color] [&>button]:duration-150 " +
    "[&>button]:hover:text-ink " +
    "[&>button[aria-pressed=true]]:bg-accent-fill [&>button[aria-pressed=true]]:text-white",

  userLinks:
    "grid gap-0.5 pt-2.5 border-t border-line " +
    "[&_a]:flex [&_a]:items-center [&_a]:min-h-9 [&_a]:px-2 [&_a]:py-1.5 [&_a]:rounded-lg " +
    "[&_a]:text-ink [&_a]:text-[13px] [&_a]:font-medium [&_a]:hover:bg-raised",

  userNote: "m-0 pt-2.5 border-t border-line text-muted text-[11.5px] leading-[1.5]",

  main: "w-[min(100%,1440px)] mx-auto px-7 pt-4 pb-14 max-[960px]:px-5 max-[960px]:pb-12 max-[600px]:px-[14px] max-[600px]:pb-10",
} as const;
