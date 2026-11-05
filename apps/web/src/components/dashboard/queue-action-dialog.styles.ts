/** Tailwind class map for the queue's confirm-an-action dialog. */
export const styles = {
  dialog:
    "w-[min(620px,calc(100vw-32px))] max-h-[calc(100dvh-48px)] m-auto p-0 overflow-y-auto overscroll-contain " +
    "rounded-[18px] border border-[#363636] bg-panel text-ink shadow-[0_24px_100px_#000c,0_3px_16px_#0008] " +
    "backdrop:bg-[#000b] backdrop:backdrop-blur-[4px] motion-reduce:backdrop:backdrop-blur-none " +
    "max-[520px]:w-[calc(100vw-24px)] max-[520px]:max-h-[calc(100dvh-24px)] max-[520px]:rounded-[15px] " +
    "[&_a[aria-disabled=true]]:opacity-50 [&_a[aria-disabled=true]]:cursor-not-allowed",

  header:
    "flex items-start gap-[13px] px-6 pt-6 pb-5 max-[520px]:gap-2.5 max-[520px]:px-[17px] max-[520px]:pt-5 max-[520px]:pb-[17px] " +
    "border-b border-b-line " +
    "[&_h2]:mt-0 [&_h2]:mb-[7px] [&_h2]:text-xl max-[520px]:[&_h2]:text-lg [&_h2]:font-[650] [&_h2]:tracking-[-.5px] [&_h2]:outline-none " +
    "[&_p]:m-0 [&_p]:max-w-[430px] [&_p]:text-muted [&_p]:text-[13px] max-[520px]:[&_p]:text-xs [&_p]:leading-[1.6]",

  actionIcon:
    "grid shrink-0 place-items-center w-[38px] h-[38px] max-[520px]:w-8 max-[520px]:h-8 " +
    "rounded-[11px] border border-[#9865f534] bg-[#9865f512] text-accent " +
    "data-[danger=true]:border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] " +
    "data-[danger=true]:bg-[color-mix(in_srgb,var(--color-danger)_6%,transparent)] data-[danger=true]:text-danger",

  close:
    "grid shrink-0 place-items-center w-[30px] h-[30px] max-[520px]:w-11 max-[520px]:h-11 " +
    "-mt-[5px] -mr-[7px] ml-auto p-0 border-0 rounded-[7px] bg-transparent text-muted " +
    "hover:not-disabled:bg-[#262626] hover:not-disabled:text-ink",

  content: "grid gap-5 px-6 py-[22px] max-[520px]:px-[17px] max-[520px]:py-[18px]",

  campaign:
    "[&_h3]:mt-0 [&_h3]:mb-1.5 [&_h3]:[overflow-wrap:anywhere] [&_h3]:text-base [&_h3]:font-semibold " +
    "[&_p]:mt-0 [&_p]:mb-[13px] [&_p]:text-muted [&_p]:text-xs [&_p]:[overflow-wrap:anywhere] " +
    "[&>div]:flex [&>div]:items-center [&>div]:gap-[7px] [&>div]:flex-wrap",

  revisionTag: "rounded-md border border-[#333] bg-[#1a1a1a] px-2 py-1 text-[#bdbdbd] text-[11px]",

  sectionHeading:
    "flex items-center justify-between gap-2.5 mb-2.5 " +
    "[&_h3]:m-0 [&_h3]:text-xs [&_h3]:font-semibold " +
    "[&_a]:inline-flex [&_a]:items-center [&_a]:gap-[7px] [&_a]:text-accent [&_a]:text-xs",

  marketingCopy:
    "max-h-[185px] overflow-y-auto whitespace-pre-wrap [overflow-wrap:anywhere] px-4 py-[15px] " +
    "rounded-[10px] border border-line bg-[#0b0b0b] text-[#ccc] text-[13px] leading-[1.8]",

  checkSummary:
    "[&_h3]:m-0 [&_h3]:text-xs [&_h3]:font-semibold " +
    "[&_dl]:grid [&_dl]:grid-cols-[.8fr_.8fr_1.4fr_1fr] [&_dl]:gap-2.5 max-[520px]:[&_dl]:gap-[7px] [&_dl]:mt-[11px] [&_dl]:mb-0 " +
    "[&_dl>div]:pl-3 max-[520px]:[&_dl>div]:pl-2 [&_dl>div]:border-l [&_dl>div]:border-l-[#333] " +
    "[&_dl>div:first-child]:pl-0 [&_dl>div:first-child]:border-0 " +
    "[&_dt]:text-muted [&_dt]:text-[10px] max-[520px]:[&_dt]:text-[9px] [&_dt]:leading-[1.5] " +
    "[&_dd]:mt-[5px] [&_dd]:mx-0 [&_dd]:mb-0 [&_dd]:text-[23px] [&_dd]:[font-variant-numeric:tabular-nums] " +
    "[&_[data-concern=true]_dd]:text-info",

  checkScope: "mt-[11px] mx-0 mb-0 text-muted text-[11px] leading-[1.6]",

  scope: "m-0 text-muted text-xs leading-[1.7]",

  warning:
    "flex items-start gap-2.5 px-[14px] py-[13px] rounded-[10px] border border-[#ffc53d2a] bg-[#ffc53d08] " +
    "text-[#d6be82] text-xs leading-[1.7] " +
    "[&>svg]:mt-[3px] [&>svg]:flex-none [&_strong]:font-semibold [&_p]:m-0 " +
    "[&_a]:inline-flex [&_a]:items-center [&_a]:gap-[7px] [&_a]:mt-[7px] [&_a]:text-accent [&_a]:text-xs",

  feedback:
    "grid gap-[9px] text-[13px] [&>span]:font-semibold " +
    "[&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:min-h-[100px] [&_textarea]:px-[14px] [&_textarea]:py-3 " +
    "[&_textarea]:rounded-[10px] [&_textarea]:border [&_textarea]:border-[#363636] [&_textarea]:bg-raised " +
    "[&_textarea]:text-ink [&_textarea]:font-[inherit] [&_textarea]:leading-[1.6] " +
    "[&_small]:text-muted [&_small]:text-[11px] [&_small]:leading-[1.6]",

  error:
    "m-0 px-[14px] py-3 rounded-[9px] text-[13px] leading-[1.6] " +
    "border border-[color-mix(in_srgb,var(--color-danger)_21%,transparent)] " +
    "bg-[color-mix(in_srgb,var(--color-danger)_4%,transparent)] text-danger " +
    "[&_p]:m-0 [&_button]:mt-2.5",

  footer:
    "flex justify-end gap-2.5 px-6 py-[18px] max-[520px]:px-[17px] max-[520px]:py-4 max-[520px]:gap-2 " +
    "border-t border-t-line bg-[#121212] " +
    "max-[520px]:[&>:is(button,a)]:flex-1 max-[520px]:[&>:is(button,a)]:min-w-0 max-[520px]:[&>:is(button,a)]:min-h-[44px] " +
    "max-[520px]:[&>:is(button,a)]:px-2.5 max-[520px]:[&>:is(button,a)]:text-xs max-[520px]:[&>:is(button,a)]:text-center",

  loading:
    "grid gap-2.5 px-0 py-[5px] " +
    "[&>span]:h-[17px] [&>span]:rounded-[5px] [&>span]:bg-[#262626] [&>span]:animate-[dim_1.5s_ease-in-out_infinite] " +
    "motion-reduce:[&>span]:animate-none " +
    "[&>span:nth-child(2)]:w-[68%] [&>span:nth-child(3)]:h-20 [&>span:nth-child(3)]:mt-3 " +
    "[&_p]:mt-[3px] [&_p]:mx-0 [&_p]:mb-0 [&_p]:text-xs [&_p]:text-muted",
} as const;
