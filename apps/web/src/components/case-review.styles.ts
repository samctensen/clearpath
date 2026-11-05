/**
 * Tailwind class map for the case review page: the summary band, the two-column
 * document/evidence workspace, the activity timeline and the loading skeletons.
 */
export const styles = {
  casePage:
    "min-w-0 text-ink " +
    "max-[640px]:[&_.cp-notice]:flex-wrap max-[640px]:[&_.cp-notice>div]:flex-1 max-[640px]:[&_.cp-notice>div]:min-w-[190px]",

  headingContext: "flex flex-wrap items-center gap-2.5 text-muted text-[11px]",

  /* One band carries the revision control, the check meter and the submission facts. */
  summary:
    "grid grid-cols-[200px_minmax(220px,1fr)_minmax(0,310px)] items-stretch gap-x-[22px] gap-y-0 " +
    "pt-[19px] pb-5 mb-5 border-y border-y-line " +
    "max-[1160px]:grid-cols-[180px_minmax(190px,1fr)_minmax(0,268px)] max-[1160px]:gap-x-[18px] " +
    "max-[980px]:grid-cols-[minmax(0,210px)_minmax(0,1fr)] max-[980px]:gap-x-5 " +
    "max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-4 max-[640px]:mb-[17px] max-[640px]:pt-[17px] max-[640px]:pb-[18px]",

  summaryLabel: "w-full text-muted text-[11px]",

  revisionToolbar:
    "flex flex-wrap content-start gap-[9px] min-w-0 max-[640px]:[&_.cp-btn]:min-h-[44px]",

  revisionSelect: "w-full",
  compareButton: "!w-full",
  returnToCurrent: "ml-auto max-[640px]:w-full max-[640px]:ml-0",

  metadata:
    "grid grid-cols-2 content-start gap-x-5 gap-y-[13px] min-w-0 " +
    "[grid-area:1/3] pl-[22px] border-l border-l-line max-[1160px]:pl-[18px] " +
    "min-[641px]:max-[980px]:[grid-area:2/1/3/-1] min-[641px]:max-[980px]:pt-[17px] min-[641px]:max-[980px]:pb-0 " +
    "min-[641px]:max-[980px]:px-0 min-[641px]:max-[980px]:border-t min-[641px]:max-[980px]:border-t-line " +
    "min-[641px]:max-[980px]:border-l-0 " +
    "max-[640px]:[grid-area:3/1] max-[640px]:pt-4 max-[640px]:px-0 max-[640px]:border-l-0 " +
    "max-[1160px]:gap-x-4 max-[1160px]:gap-y-3 " +
    "max-[980px]:grid-cols-4 max-[980px]:gap-x-5 max-[980px]:gap-y-3 " +
    "max-[640px]:grid-cols-2 max-[640px]:gap-x-[18px] max-[640px]:gap-y-[15px] " +
    "[&>div]:min-w-0 [&_dt]:text-muted [&_dt]:text-[11px] " +
    "[&_dd]:mt-[3px] [&_dd]:text-heading [&_dd]:text-xs [&_dd]:font-semibold [&_dd]:[overflow-wrap:anywhere]",

  /* Coverage meter: one segment per recorded check; hover or focus names it. */
  coverage:
    "[--tip-half:103px] max-[1160px]:[--tip-half:95px] max-[640px]:[--tip-half:86px] min-w-0 " +
    "[grid-area:1/2] pl-[22px] border-l border-l-line max-[1160px]:pl-[18px] min-[641px]:max-[980px]:pl-5 " +
    "max-[640px]:[grid-area:2/1] max-[640px]:pt-4 max-[640px]:pb-0 max-[640px]:px-0 " +
    "max-[640px]:border-t max-[640px]:border-t-line max-[640px]:border-l-0",

  coverageTitle:
    "flex items-baseline flex-wrap gap-x-2.5 gap-y-[3px] max-[640px]:justify-between max-[640px]:w-full " +
    "[&_strong]:text-heading [&_strong]:text-[12.5px] [&_strong]:font-[650] " +
    "[&>span]:text-muted [&>span]:text-[11px]",

  coverageEmpty: "mt-[13px] text-muted text-xs",
  coverageFinding: "text-info",
  coverageUnknown: "text-waiting",
  coveragePassed: "text-approved",
  coverageNotApplicable: "text-[#6f6f6f]",

  meter: "relative flex items-center gap-[3px] mt-[7px]",

  meterSegment:
    "flex items-center flex-[1_1_0] min-w-[10px] h-[26px] max-[640px]:h-[34px] p-0 border-0 rounded bg-transparent " +
    "[&>span]:w-full [&>span]:h-[9px] [&>span]:rounded-[3px] [&>span]:bg-current [&>span]:opacity-[.72] " +
    "[&>span]:transition-[opacity,height] [&>span]:duration-[140ms] [&>span]:ease-out motion-reduce:[&>span]:transition-none " +
    "hover:[&>span]:h-[15px] hover:[&>span]:opacity-100 focus-visible:outline-offset-2",

  meterSegmentActive: "[&>span]:!h-[15px] [&>span]:!opacity-100",

  meterTip:
    "absolute top-[calc(100%+7px)] z-[4] w-[calc(var(--tip-half)*2)] px-[11px] py-[9px] " +
    "rounded-[9px] border border-[#3a3a3a] bg-raised shadow-[0_12px_26px_#000000a8] " +
    "-translate-x-1/2 pointer-events-none [&_.cr-outcome]:mt-1.5",

  meterTipName: "block text-heading text-xs font-semibold leading-[1.45]",

  coverageOutcome: "cr-outcome flex items-center gap-1.5 text-[11px] [&>span]:w-[5px] [&>span]:h-[5px] [&>span]:rounded-full [&>span]:bg-current",

  coverageLegend:
    "flex flex-wrap gap-x-4 gap-y-1.5 mt-3 mx-0 mb-0 p-0 text-muted text-[11px] list-none " +
    "max-[1160px]:gap-x-[13px] " +
    "max-[640px]:grid max-[640px]:grid-cols-2 max-[640px]:gap-x-3 max-[640px]:gap-y-[9px] " +
    "[&>li]:flex [&>li]:items-center [&>li]:gap-[5px] [&>li[data-zero=true]]:opacity-55 " +
    "[&>li>span]:w-[5px] [&>li>span]:h-[5px] [&>li>span]:mr-0.5 [&>li>span]:rounded-full [&>li>span]:bg-current " +
    "[&_strong]:text-[#d4d4d4] [&_strong]:font-[650] [&_strong]:[font-variant-numeric:tabular-nums]",

  reviewWorkspace:
    "grid grid-cols-[minmax(0,1.25fr)_minmax(360px,1fr)] items-stretch rounded-xl border border-line bg-[#101010] " +
    "max-[1160px]:grid-cols-[minmax(0,1fr)_minmax(340px,1fr)] max-[980px]:grid-cols-[minmax(0,1fr)]",

  documentColumn: "min-w-0 border-r border-r-line max-[980px]:border-r-0",

  documentContent:
    "min-w-0 focus-visible:outline-offset-[-3px] " +
    "min-[981px]:sticky min-[981px]:top-5 min-[981px]:max-h-[calc(100dvh-40px)] min-[981px]:overflow-y-auto " +
    "min-[981px]:[scrollbar-width:thin] min-[981px]:[scrollbar-color:#444_transparent]",

  document: "px-[30px] pt-[26px] max-[1160px]:px-6 max-[640px]:px-[19px] max-[640px]:pt-[21px]",

  documentHeading: "flex flex-wrap items-center justify-between gap-[13px] max-[640px]:items-start",

  sectionHeading:
    "flex items-center gap-[9px] min-w-0 [&>span]:text-[#999] " +
    "[&_h2]:text-base [&_h2]:leading-[1.4] [&_h2]:font-[650] [&_h2]:tracking-[-.025em]",

  documentMeta:
    "flex flex-wrap gap-x-[14px] gap-y-[5px] text-[#8c8c8c] text-[10px] max-[640px]:w-full [&>span]:text-[#b1b1b1]",

  excerptHint:
    "flex items-center gap-[7px] mt-6 text-[#888] text-[11px] " +
    "max-[640px]:items-start max-[640px]:mt-5 max-[640px]:leading-[1.6] " +
    "[&>span]:w-2.5 [&>span]:h-2.5 [&>span]:shrink-0 [&>span]:rounded-sm [&>span]:bg-[#3e3020] [&>span]:border [&>span]:border-[#6e5231] " +
    "max-[640px]:[&>span]:mt-[3px]",

  copyText:
    "min-h-[120px] max-w-[72ch] pt-[26px] pb-[30px] text-[#dfdfdf] text-base max-[1160px]:text-[15px] max-[980px]:text-base " +
    "max-[640px]:text-[15px] max-[640px]:pt-[23px] max-[640px]:pb-7 max-[640px]:leading-[1.9] " +
    "font-[450] leading-[1.95] whitespace-pre-wrap [overflow-wrap:anywhere] " +
    "[&_mark]:py-px [&_mark]:px-0 [&_mark]:rounded-sm [&_mark]:bg-[#3b2c19] [&_mark]:text-[#e6c795] " +
    "[&_mark]:[box-decoration-break:clone] [&_mark]:[-webkit-box-decoration-break:clone] [&_mark]:scroll-m-10 " +
    "[&_mark.cr-active]:px-[3px] [&_mark.cr-active]:rounded-[3px] [&_mark.cr-active]:bg-[#6b4d22] [&_mark.cr-active]:text-[#ffe8c4] " +
    "[&_mark:focus]:px-[3px] [&_mark:focus]:rounded-[3px] [&_mark:focus]:bg-[#6b4d22] [&_mark:focus]:text-[#ffe8c4]",

  activeExcerpt: "cr-active",

  supportingCopy:
    "border-t border-t-line py-[21px] " +
    "[&_h3]:text-xs [&_h3]:text-[#c7c7c7] [&_h3]:font-[650] " +
    "[&_p]:mt-2 [&_p]:text-[#999] [&_p]:text-[13px] [&_p]:leading-[1.85] [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere]",

  documentFootnote:
    "flex items-start gap-[9px] pt-[15px] pb-[23px] text-[#858585] text-[11px] leading-[1.65] [&>svg]:mt-0.5 [&>svg]:flex-none",

  reference:
    "px-[30px] pt-6 pb-[26px] max-[1160px]:px-6 max-[640px]:px-[19px] max-[640px]:py-[22px] " +
    "border-t border-t-line bg-[#0d0d0d] rounded-bl-xl max-[980px]:rounded-bl-none " +
    "[&_h2]:!text-[13px] [&_.cr-section>span]:text-[#777] " +
    "[&>.cp-text-link]:mt-[19px] [&>.cp-text-link]:text-xs " +
    "[&>p]:my-4 [&>p]:text-xs",

  referenceVersions:
    "flex flex-wrap gap-x-8 gap-y-4 mt-[17px] " +
    "[&_dt]:text-muted [&_dt]:text-[11px] " +
    "[&_dd]:mt-[3px] [&_dd]:text-[#c6c6c6] [&_dd]:text-xs [&_dd]:font-medium [&_dd]:[overflow-wrap:anywhere]",

  offerSnapshot:
    "mt-[22px] [&>h3]:mb-[13px] [&>h3]:text-[13px] [&>h3]:font-semibold " +
    "[&_.cp-terms]:my-0 [&_.cp-terms]:text-xs [&_.cp-terms_dt]:!text-xs [&_.cp-terms_dd]:!text-xs",

  /* Evidence rail: the shared check cards at this page's tighter rhythm. */
  evidenceRail:
    "min-w-0 max-[980px]:border-t max-[980px]:border-t-[#303030] " +
    "[&_.cp-check-list]:gap-0 [&_.cp-check-list]:mt-[18px] " +
    "[&_.cp-check-card]:py-5 [&_.cp-check-card]:border-0 [&_.cp-check-card]:border-t [&_.cp-check-card]:border-t-line " +
    "[&_.cp-check-card]:rounded-none [&_.cp-check-card]:bg-transparent [&_.cp-check-card]:text-[13px] [&_.cp-check-card]:leading-[1.75] " +
    "[&_.cp-check-heading]:gap-x-2.5 [&_.cp-check-heading]:gap-y-2 " +
    "[&_.cp-check-heading_h3]:max-w-[32ch] max-[640px]:[&_.cp-check-heading_h3]:max-w-none " +
    "[&_.cp-check-heading_h3]:text-[13px] [&_.cp-check-heading_h3]:font-[650] " +
    "[&_.cp-check-badge]:text-[11px] " +
    "[&_.cp-source-line]:mt-[14px] [&_.cp-source-line]:text-xs " +
    "[&_.cp-finding-actions]:mt-[15px] " +
    "[&_.cp-evidence-quote]:text-[13px] [&_.cp-evidence-quote]:leading-[1.75] " +
    "[&_.cp-check-change]:text-[11px] [&_.cp-check-change]:font-medium " +
    "[&_.cp-suggestion>strong]:mb-1 [&_.cp-suggestion>strong]:text-xs [&_.cp-suggestion>strong]:font-[650] " +
    "[&_.cp-severity]:text-[11px] [&_.cp-severity]:font-semibold " +
    "[&_.cp-btn-sm]:text-xs max-[640px]:[&_.cp-btn-sm]:min-h-[44px]",

  checks: "[--checks-inset:24px] px-[var(--checks-inset)] pt-[26px] pb-[22px] max-[640px]:px-[19px] max-[640px]:py-[22px]",

  checksHeading:
    "flex flex-wrap justify-between items-center gap-x-2.5 gap-y-2 [&_h2]:!text-[15px]",

  concernCount: "text-[#a4a4a4] text-[11px] [font-variant-numeric:tabular-nums]",
  checkScope: "mt-[11px] text-[#999] text-xs leading-[1.75]",

  scopeDetails:
    "mt-[7px] text-[#999] text-xs " +
    "[&>summary]:w-fit [&>summary]:text-[#b9b9b9] [&>summary]:cursor-pointer " +
    "max-[640px]:[&>summary]:min-h-[44px] max-[640px]:[&>summary]:py-[11px] " +
    "[&_p]:mt-2.5 [&_p]:leading-[1.75]",

  /* The wash reads as a band across the rail, so the target stretches into the
     section's horizontal padding and gives it back as its own. The box is that
     width whether or not it is flashing, so nothing shifts when it fires. */
  checkTarget:
    "min-w-0 -mx-[var(--checks-inset,24px)] px-[var(--checks-inset,24px)] scroll-mt-[26px] focus:outline-none",

  /* One token only: case-review toggles this with classList, which rejects spaces.
     The global reduced-motion rule already collapses the duration. */
  checkFlash: "animate-check-flash",

  noConcerns:
    "flex gap-[11px] items-start my-[22px] text-[#999] text-[13px] [&>svg]:text-approved [&>svg]:mt-0.5 [&>svg]:flex-none",

  coverageDetails:
    "mt-1 pt-[15px] border-t border-t-line " +
    "[&>summary]:text-[#b9b9b9] [&>summary]:cursor-pointer [&>summary]:text-xs [&>summary]:leading-[1.6] " +
    "max-[640px]:[&>summary]:min-h-[44px] max-[640px]:[&>summary]:py-[11px] " +
    "[&>summary>span]:ml-1.5 [&>summary>span]:text-[#777] [&>summary>span]:[font-variant-numeric:tabular-nums] " +
    "open:[&>summary]:text-[#d2b5ff]",

  manualSection:
    "border-t border-t-line " +
    "[&_.cp-panel]:m-0 [&_.cp-panel]:px-6 [&_.cp-panel]:py-[23px] max-[640px]:[&_.cp-panel]:px-[19px] " +
    "[&_.cp-panel]:border-0 [&_.cp-panel]:rounded-none [&_.cp-panel]:bg-transparent " +
    "[&_.cp-panel-heading]:flex-wrap [&_.cp-panel-heading]:gap-[14px] " +
    "[&_h2]:text-[15px] [&_h2]:font-[650] [&_.cp-panel-heading_p]:text-xs " +
    "[&_.cp-panel-caption]:text-[#999] [&_.cp-panel-caption]:text-[13px] [&_.cp-panel-caption]:leading-[1.8]",

  decisionSection:
    "border-t border-t-[#3d2a5b] bg-[#16111e] rounded-br-xl max-[980px]:rounded-bl-xl " +
    "[&_.cp-panel]:m-0 [&_.cp-panel]:px-6 [&_.cp-panel]:py-[23px] max-[640px]:[&_.cp-panel]:px-[19px] " +
    "[&_.cp-panel]:border-0 [&_.cp-panel]:rounded-none [&_.cp-panel]:bg-transparent " +
    "[&_.cp-panel-heading]:flex-wrap [&_.cp-panel-heading]:gap-[14px] " +
    "[&_h2]:text-[15px] [&_h2]:font-[650] [&_.cp-panel-heading_p]:text-xs " +
    "[&_.cp-panel-caption]:text-[#999] [&_.cp-panel-caption]:text-[13px] [&_.cp-panel-caption]:leading-[1.8] " +
    "[&_.cp-action-row]:gap-2 [&_.cp-action-row]:mt-[18px] " +
    "[&_.cp-btn]:text-xs max-[640px]:[&_.cp-btn]:min-h-[44px] max-[640px]:[&_.cp-action-row>button]:flex-auto",

  advisory:
    "mt-[30px] py-[27px] border-y border-y-line max-[640px]:mt-6 max-[640px]:py-6 " +
    "[&>summary]:cursor-pointer [&>summary]:px-5 [&>summary]:py-4 [&>summary]:font-semibold " +
    "[&>summary_span]:font-normal [&>summary_span]:opacity-75 " +
    "[&>.cp-panel]:m-0 [&>.cp-panel]:p-0 [&>.cp-panel]:border-0 [&>.cp-panel]:rounded-none [&>.cp-panel]:bg-transparent " +
    "[&_h2]:text-base [&_h2]:font-[650] [&_.cp-panel-heading_p]:text-xs " +
    "[&_.cp-check-card]:py-[18px] [&_.cp-check-card]:border-0 [&_.cp-check-card]:border-t [&_.cp-check-card]:border-t-line " +
    "[&_.cp-check-card]:rounded-none [&_.cp-check-card]:bg-transparent [&_.cp-check-card]:text-[13px]",

  activity: "mt-7",
  activityHeading:
    "flex items-center justify-between gap-[18px] max-[640px]:items-start [&>span]:text-[#777] [&>span]:text-[11px]",

  timeline:
    "p-0 mt-[22px] mx-0 mb-0 list-none " +
    "[&>li]:relative [&>li]:grid [&>li]:grid-cols-[16px_minmax(0,1fr)] [&>li]:gap-4 max-[640px]:[&>li]:gap-[11px] " +
    "[&>li:not(:last-child)]:before:absolute [&>li:not(:last-child)]:before:left-[5px] [&>li:not(:last-child)]:before:top-2.5 " +
    "[&>li:not(:last-child)]:before:-bottom-2.5 [&>li:not(:last-child)]:before:content-[''] " +
    "[&>li:not(:last-child)]:before:border-l [&>li:not(:last-child)]:before:border-l-[#303030] " +
    "[&>li:first-child_.cr-dot]:bg-[#a47add]",

  timelineDot: "cr-dot z-[1] w-[11px] h-[11px] mt-1 border-[3px] border-[#161616] rounded-full bg-[#888]",

  activityEvent:
    "min-w-0 pt-0 px-0 pb-[25px] " +
    "[&_p]:max-w-[100ch] [&_p]:mt-1.5 [&_p]:text-[#929292] [&_p]:text-xs [&_p]:leading-[1.8] " +
    "[&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere]",

  eventHeading:
    "flex flex-wrap justify-between gap-x-[18px] gap-y-1 max-[640px]:flex-col " +
    "[&_strong]:text-[#c7c7c7] [&_strong]:text-xs [&_strong]:font-semibold " +
    "[&_time]:text-[#777] [&_time]:text-[10px] [&_time]:[font-variant-numeric:tabular-nums]",

  eventMetadata: "flex gap-[14px] mt-[7px] text-[#777] text-[10px]",

  comparison:
    "p-6 mb-6 max-[640px]:px-[18px] max-[640px]:py-5 rounded-[10px] border border-line bg-[#101010] " +
    "[&>p]:mt-2.5 [&>p]:text-[#999] [&>p]:text-xs",

  comparisonColumns:
    "grid grid-cols-2 max-[640px]:grid-cols-[minmax(0,1fr)] gap-6 mt-[22px] " +
    "[&>div]:min-w-0 " +
    "[&_h3]:flex [&_h3]:items-center [&_h3]:gap-[9px] [&_h3]:py-[13px] [&_h3]:border-y [&_h3]:border-y-[#262626] " +
    "[&_h3]:text-xs [&_h3]:font-semibold " +
    "[&_h3>span]:text-[#888] [&_h3>span]:text-[10px] [&_h3>span]:font-normal",

  comparisonCopy:
    "pt-[17px] text-[#bbb] text-[13px] leading-[1.85] whitespace-pre-wrap [overflow-wrap:anywhere]",

  /* Loading skeletons */
  loading: "min-w-0",

  loadingContext:
    "flex gap-[30px] max-[640px]:gap-[14px] py-6 mb-7 border-y border-y-line " +
    "[&>span]:block [&>span]:w-[112px] [&>span]:h-[34px] [&>span]:rounded-[3px] [&>span]:bg-[#222] " +
    "[&>span]:animate-[casePulse_1.9s_ease-in-out_infinite] motion-reduce:[&>span]:animate-none " +
    "max-[640px]:[&>span]:flex-1 max-[640px]:[&>span]:w-auto max-[640px]:[&>span:last-child]:hidden",

  loadingWorkspace:
    "grid grid-cols-[minmax(0,1.25fr)_minmax(360px,1fr)] max-[980px]:grid-cols-[minmax(0,1fr)] " +
    "min-h-[470px] rounded-xl border border-line bg-[#101010]",

  loadingCopy:
    "grid content-start gap-[17px] p-[30px] max-[640px]:px-[19px] max-[640px]:py-6 " +
    "border-r border-r-line max-[980px]:border-r-0 max-[980px]:border-b max-[980px]:border-b-line " +
    "[&>span]:block [&>span]:w-full [&>span]:h-[11px] [&>span]:rounded-[3px] [&>span]:bg-[#222] " +
    "[&>span]:animate-[casePulse_1.9s_ease-in-out_infinite] motion-reduce:[&>span]:animate-none " +
    "[&>span:nth-child(3n)]:w-[78%] [&>span:nth-child(4n)]:w-[91%] " +
    "[&>span.cr-skel-title]:w-[35%] [&>span.cr-skel-title]:h-4 [&>span.cr-skel-title]:mb-[30px]",

  loadingEvidence:
    "p-[30px] max-[640px]:px-[19px] max-[640px]:py-6 " +
    "[&>div]:grid [&>div]:gap-[13px] [&>div]:pb-[26px] [&>div]:mb-[26px] [&>div]:border-b [&>div]:border-b-[#262626] " +
    "[&_span]:block [&_span]:w-[90%] [&_span]:h-[9px] [&_span]:rounded-[3px] [&_span]:bg-[#222] " +
    "[&_span]:animate-[casePulse_1.9s_ease-in-out_infinite] motion-reduce:[&_span]:animate-none " +
    "[&_span.cr-skel-title]:w-[44%] [&_span.cr-skel-title]:h-[13px] [&_span.cr-skel-title]:mb-1.5",

  skeletonTitle: "cr-skel-title",
} as const;
