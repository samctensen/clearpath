/** Field and inline-form styling shared by every form in the workspace. */

export const field =
  "grid min-w-0 gap-[7px] text-[#c9c9c9] text-[12.5px] font-medium " +
  "[&_small]:ml-1 [&_small]:text-muted [&_small]:font-normal " +
  "[&_:is(input,textarea)]:w-full [&_:is(input,textarea)]:text-[14px] [&_:is(input,textarea)]:font-normal";

/** A form that appears in place under the control that opened it. */
export const inlineForm =
  "grid justify-items-start gap-2.5 mt-3 [&_p]:text-xs [&>label]:w-full";
