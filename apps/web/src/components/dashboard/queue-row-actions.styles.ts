/** Tailwind class map for the per-row action menu in the queue. */
export const styles = {
  trigger:
    "grid place-items-center w-8 h-8 max-[650px]:w-9 max-[650px]:h-11 p-0 rounded-lg border border-transparent bg-transparent text-muted " +
    "hover:border-[#363636] hover:bg-[#242424] hover:text-ink " +
    "aria-expanded:border-[#363636] aria-expanded:bg-[#242424] aria-expanded:text-ink",

  menu:
    "fixed z-[1000] overflow-y-auto p-[5px] rounded-[10px] border border-[#363636] bg-raised shadow-[0_16px_40px_#0009,0_2px_8px_#0005] " +
    "[&_:is(a,button)]:flex [&_:is(a,button)]:items-center [&_:is(a,button)]:gap-2.5 [&_:is(a,button)]:w-full " +
    "[&_:is(a,button)]:min-h-[38px] max-[650px]:[&_:is(a,button)]:min-h-[44px] [&_:is(a,button)]:px-2.5 [&_:is(a,button)]:py-[9px] " +
    "[&_:is(a,button)]:border-0 [&_:is(a,button)]:rounded-md [&_:is(a,button)]:bg-transparent [&_:is(a,button)]:text-ink " +
    "[&_:is(a,button)]:font-[inherit] [&_:is(a,button)]:text-[13px] [&_:is(a,button)]:leading-[1.4] " +
    "[&_:is(a,button)]:text-left [&_:is(a,button)]:whitespace-nowrap " +
    "[&_:is(a,button)>span]:text-muted " +
    "[&_:is(a,button):hover]:bg-[#292929] [&_:is(a,button):focus]:bg-[#292929] [&_:is(a,button):focus]:outline-none",

  danger:
    "!text-danger [&>span]:!text-danger " +
    "hover:!bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] focus:!bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)]",

  separator: "h-px mx-[5px] my-1 bg-[#353535]",

  notice:
    "fixed right-5 bottom-5 z-[1100] max-w-[min(360px,calc(100vw-40px))] px-4 py-[11px] " +
    "rounded-[10px] border border-[#363636] bg-[#202020] text-ink shadow-[0_8px_28px_#0008] text-[13px]",
} as const;
