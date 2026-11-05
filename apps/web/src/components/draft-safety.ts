/** Shared styling for the draft-protection dialog and the conflict-recovery notice. */

export const draftDialog =
  "w-[min(560px,calc(100vw-32px))] max-h-[calc(100dvh-40px)] m-auto p-6 max-[600px]:px-[17px] max-[600px]:py-5 " +
  "overflow-y-auto rounded-[18px] border border-[#363636] bg-panel text-ink shadow-[0_24px_100px_#000c] " +
  "backdrop:bg-[#000b] " +
  "[&>header]:flex [&>header]:items-center [&>header]:gap-3 [&>header]:mb-3 " +
  "[&>header>svg]:text-accent [&>header>svg]:flex-none " +
  "[&_h2]:text-xl [&>p]:text-muted [&>p]:leading-[1.7] " +
  "[&>footer]:flex [&>footer]:flex-wrap [&>footer]:gap-[9px] [&>footer]:mt-[18px] " +
  "max-[600px]:[&>footer]:flex-col max-[600px]:[&>footer>button]:min-h-[44px] max-[600px]:[&>footer>button]:whitespace-normal";

export const dialogActions = "flex flex-wrap gap-[9px] mt-[18px] max-[600px]:[&>button]:min-h-[44px] max-[600px]:[&>button]:whitespace-normal";

export const discardArea = "basis-full mt-[7px] pt-3 border-t border-line";

export const discardButton =
  "text-danger hover:not-disabled:bg-[color-mix(in_srgb,var(--color-danger)_5%,transparent)] " +
  "hover:not-disabled:text-[color-mix(in_srgb,var(--color-danger)_80%,var(--color-ink))]";

export const draftStatus = "text-muted text-xs mb-3";

export const draftNotice =
  "px-[17px] py-[15px] mb-4 rounded-xl border border-line bg-panel [overflow-wrap:anywhere] " +
  "[&>p]:mt-[5px] [&>p]:text-muted [&>p]:text-xs [&>p]:leading-[1.7] [&_strong]:text-[13px]";

export const draftCompare =
  "grid grid-cols-2 max-[600px]:grid-cols-1 gap-[13px] mt-4 " +
  "[&>section]:min-w-0 [&>section]:p-[14px] [&>section]:rounded-[10px] [&>section]:border [&>section]:border-line [&>section]:bg-canvas " +
  "[&_h3]:mb-2.5 [&_dl]:grid [&_dl]:gap-2 [&_dl]:text-xs [&_dt]:text-muted " +
  "[&_dd]:whitespace-pre-wrap [&_dd]:[overflow-wrap:anywhere]";

export const draftCopy =
  "max-h-[240px] overflow-auto mt-3 text-xs leading-[1.8] whitespace-pre-wrap [overflow-wrap:anywhere]";

export const draftConfirm =
  "flex items-start gap-[9px] mt-[15px] text-xs leading-[1.6] " +
  "[&>input]:flex-none [&>input]:mt-1 [&>input]:accent-[var(--color-accent-fill)]";
