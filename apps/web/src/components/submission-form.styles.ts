/** Tailwind class map for the submission editor, its self-check rail and footer. */
export const styles = {
  page: "min-w-0",

  exampleError:
    "grid justify-items-start gap-2.5 mb-5 " +
    "[&>.cp-error]:w-full " +
    "[&>a]:text-accent [&>a]:text-xs [&>a]:underline [&>a]:underline-offset-[3px]",

  /* Column gaps only: the editor and the footer are one card split across two rows, so a
     row gap would open a seam between them. A stacked layout wants one, and says so. */
  layout:
    "grid grid-cols-[minmax(0,1fr)_minmax(270px,320px)] items-start gap-x-6 gap-y-0 text-ink " +
    "min-[1440px]:grid-cols-[minmax(0,1fr)_350px] min-[1440px]:gap-x-7 " +
    "max-[1100px]:grid-cols-[minmax(0,1fr)_280px] max-[1100px]:gap-x-[18px] " +
    "max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:gap-y-[22px]",

  /* DOM order stays editor -> self-check -> submit at every breakpoint. */
  form:
    "[grid-template-areas:'editor_rail''footer_rail'] grid-rows-[min-content_1fr] " +
    "max-[900px]:[grid-template-areas:'editor''rail''footer'] max-[900px]:grid-rows-[auto_auto_auto] " +
    "[&>.sf-editor]:[grid-area:editor] [&>.sf-editor]:border-b-0 [&>.sf-editor]:rounded-b-none " +
    "max-[900px]:[&>.sf-editor]:border-b max-[900px]:[&>.sf-editor]:border-b-line max-[900px]:[&>.sf-editor]:rounded-[14px] " +
    "[&>.sf-rail]:[grid-area:rail] " +
    "[&>.sf-footer]:[grid-area:footer] [&>.sf-footer]:border [&>.sf-footer]:border-line [&>.sf-footer]:rounded-b-[14px] [&>.sf-footer]:rounded-t-none " +
    "max-[900px]:[&>.sf-footer]:rounded-[14px]",

  editor: "sf-editor min-w-0 rounded-[14px] border border-line bg-panel overflow-hidden",

  fields: "min-w-0 m-0 p-0 border-0",

  section:
    "px-7 pt-[25px] pb-7 [&+&]:border-t [&+&]:border-t-line " +
    "min-[1440px]:px-8 max-[1100px]:p-[22px] max-[600px]:px-[17px] max-[600px]:py-5 " +
    "[&>h2]:text-ink [&>h2]:text-base [&>h2]:font-semibold [&>h2]:tracking-[-.025em]",

  sectionHeading:
    "flex justify-between gap-[14px] items-start mb-[23px] max-[600px]:mb-5 " +
    "[&_p]:mt-[5px] [&_p]:text-muted [&_p]:text-xs [&>span]:text-muted",

  revision: "px-[7px] py-[3px] rounded-[5px] border border-line text-muted text-[11px] whitespace-nowrap",

  fieldGrid:
    "grid grid-cols-2 gap-x-5 gap-y-[18px] max-[1100px]:gap-x-[14px] max-[1100px]:gap-y-[17px] " +
    "max-[600px]:grid-cols-[minmax(0,1fr)] max-[600px]:gap-[17px]",

  field:
    "flex flex-col min-w-0 gap-[7px] text-ink text-xs font-medium " +
    "[&_:is(input,textarea)]:w-full [&_:is(input,textarea)]:min-w-0 [&_:is(input,textarea)]:min-h-10 " +
    "[&_:is(input,textarea)]:px-3 [&_:is(input,textarea)]:py-2.5 [&_:is(input,textarea)]:rounded-lg " +
    "[&_:is(input,textarea)]:border [&_:is(input,textarea)]:border-line [&_:is(input,textarea)]:bg-canvas " +
    "[&_:is(input,textarea)]:text-ink [&_:is(input,textarea)]:text-[13px] [&_:is(input,textarea)]:font-normal " +
    "[&_:is(input,textarea)]:transition-[border-color] [&_:is(input,textarea)]:duration-150 " +
    "motion-reduce:[&_:is(input,textarea)]:transition-none " +
    "max-[600px]:[&_input]:min-h-[44px] " +
    "hover:[&_:is(input,textarea):not([aria-invalid=true])]:border-[#424242] " +
    "[&_:is(input,textarea):focus-visible:not([aria-invalid=true])]:border-accent [&_:is(input,textarea):focus-visible]:outline-none " +
    "[&_:is(input,textarea)]:placeholder:text-[#737373] " +
    "[&_:is(input,textarea)[aria-invalid=true]]:border-danger " +
    "[&_input[type=date]]:[color-scheme:dark]",

  /* Sits under the field it names; the message is the only cue a screen reader needs. */
  fieldError: "text-danger text-[11px] font-normal leading-[1.55]",

  wide: "col-span-full",

  fieldLabel:
    "flex justify-between items-baseline gap-3 " +
    "[&_small]:text-muted [&_small]:text-[11px] max-[600px]:[&_small]:text-[10px] [&_small]:font-normal",

  copyInput: "!min-h-[200px] !p-[18px] max-[600px]:!p-[13px] !text-[14px] !leading-[1.85]",

  evidenceField: "mt-[21px] [&_textarea]:leading-[1.7]",

  catalogError: "mt-[18px]",

  formFooter:
    "sf-footer grid gap-3 px-7 py-[18px] max-[1100px]:px-[22px] max-[600px]:p-4 " +
    "border-t border-t-line bg-panel [&>.cp-error]:mb-0",

  /* Each button carries its own depth: a row-wide accent glow also haloed the cancel. */
  submitRow:
    "flex justify-between items-center gap-3 " +
    "max-[600px]:[&_button]:min-h-[44px] max-[600px]:[&_button]:px-3",

  roleNote: "text-muted text-xs",

  rail:
    "sf-rail grid min-w-0 gap-[23px] " +
    "max-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] max-[900px]:items-start " +
    "max-[600px]:grid-cols-[minmax(0,1fr)] max-[600px]:gap-[21px]",

  checkPanel:
    "min-w-0 px-5 py-[21px] max-[1100px]:px-[17px] max-[1100px]:py-[19px] rounded-[14px] border border-line bg-panel " +
    "max-[900px]:row-span-2 max-[600px]:row-auto " +
    "[&>h2]:text-ink [&>h2]:text-base [&>h2]:font-semibold [&>h2]:tracking-[-.025em]",

  checkHeading: "flex items-center gap-[9px]",

  checkIcon: "grid place-items-center w-[29px] h-[29px] rounded-[7px] text-[#b79aef] bg-[#241a35]",

  checkIntro: "mt-[13px] text-muted text-xs leading-[1.75]",

  checkButton: "!w-full mt-[17px] max-[600px]:!min-h-[44px]",

  checkError: "mt-[14px]",

  checkEmpty:
    "flex items-start flex-wrap gap-[9px] pt-5 mt-5 border-t border-t-line text-muted text-xs leading-[1.7] " +
    "[&>p]:flex-1 [&>p]:min-w-0",

  emptyDot: "shrink-0 w-[7px] h-[7px] mt-1.5 rounded-full bg-[#5c5c5c]",

  /* The preview reuses the shared check cards at a tighter rhythm. */
  previewBody:
    "mt-5 pt-[17px] border-t border-t-line " +
    "[&_.cp-coverage]:grid [&_.cp-coverage]:grid-cols-1 [&_.cp-coverage]:gap-[7px] [&_.cp-coverage]:mt-[15px] " +
    "[&_.cp-check-list]:mt-[18px] [&_.cp-check-list]:gap-2.5 " +
    "[&_.cp-check-card]:px-3 [&_.cp-check-card]:py-[13px] " +
    "[&_.cp-check-heading]:gap-2",

  draftLabel: "mb-[9px] text-ink text-[13px] font-semibold",

  coverageDetails:
    "mt-[15px] pt-[15px] border-t border-t-line " +
    "[&>summary]:text-muted [&>summary]:cursor-pointer [&>summary]:text-xs [&>summary]:leading-[1.6] " +
    "max-[600px]:[&>summary]:min-h-[44px] max-[600px]:[&>summary]:py-[11px] " +
    "[&>summary>span]:ml-1.5 [&>summary>span]:[font-variant-numeric:tabular-nums] " +
    "open:[&>summary]:text-accent",

  scope: "text-muted text-xs leading-[1.7]",

  checkVersions: "flex flex-wrap gap-x-[13px] gap-y-[5px] mt-[14px] text-muted text-[10px]",

  reference:
    "px-[5px] text-muted text-xs leading-[1.7] " +
    "[&_h3]:flex [&_h3]:items-center [&_h3]:gap-2 [&_h3]:mb-3 [&_h3]:text-ink [&_h3]:text-xs [&_h3]:font-semibold " +
    "[&_a]:inline-flex [&_a]:items-center [&_a]:gap-[5px] [&_a]:mt-[11px] [&_a]:text-accent " +
    "hover:[&_a]:underline hover:[&_a]:underline-offset-[3px]",

  offerName: "text-ink text-[13px] font-medium [overflow-wrap:anywhere]",

  scopeNote:
    "flex items-start gap-[9px] px-[5px] pt-5 border-t border-t-line text-muted text-[11px] leading-[1.75] " +
    "max-[900px]:self-start [&>svg]:mt-0.5 [&>svg]:flex-none",

  loadingFields:
    "grid grid-cols-2 gap-x-5 gap-y-[22px] mt-[25px] max-[600px]:grid-cols-1 max-[600px]:gap-[18px]",

  skeleton:
    "block h-10 bg-raised rounded-[7px] animate-[catalog-pulse_1.7s_ease-in-out_infinite] " +
    "motion-reduce:animate-none motion-reduce:opacity-65",

  paused: "[&_span]:!animate-none [&_span]:opacity-45",

  loadingCopy: "!h-[200px] mt-6",
  loadingCheck: "!h-[125px] mt-5",
  checkSkeleton: "grid basis-full gap-[9px] [&>span]:!h-8",
} as const;
