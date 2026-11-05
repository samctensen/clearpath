/** Field and inline-form styling shared by every form in the workspace. */

export const field =
  "grid min-w-0 gap-[7px] text-[#c9c9c9] text-[12.5px] font-medium " +
  "[&_small]:ml-1 [&_small]:text-muted [&_small]:font-normal " +
  "[&_:is(input,textarea)]:w-full [&_:is(input,textarea)]:text-[14px] [&_:is(input,textarea)]:font-normal";

/** A form that appears in place under the control that opened it. */
export const inlineForm =
  "grid justify-items-start gap-2.5 mt-3 [&_p]:text-xs [&>label]:w-full";

/** Wraps an inline form so it grows and shrinks in place instead of snapping.
   The row track carries the motion (`0fr` to `1fr`) and `expandableInner` clips
   the form while it moves. The inner side padding, cancelled by the matching
   negative margin, holds the focus ring of a full-width field inside the clip
   box; vertical room for the last control's ring belongs to the form itself,
   since padding here cannot shrink and would leave a sliver when collapsed.
   Collapsed content stays mounted for the transition, so the caller marks the
   wrapper `inert` to keep it off the tab order. */
export const expandable =
  "grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-200 ease-out " +
  "data-expanded:grid-rows-[1fr] data-expanded:opacity-100 " +
  "motion-reduce:transition-none";

export const expandableInner = "min-h-0 overflow-hidden px-1 -mx-1";
