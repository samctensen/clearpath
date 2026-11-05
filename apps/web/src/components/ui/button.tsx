import type { ComponentPropsWithRef } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/* `:disabled` only matches form controls, so the inert styles are also keyed off an
   ancestor `fieldset:disabled` and off `aria-disabled` for the links styled as buttons. */
const inert =
  "disabled:bg-[#202020] disabled:text-[#858585] disabled:border-[#303030] disabled:shadow-none disabled:opacity-100 " +
  "aria-disabled:bg-[#202020] aria-disabled:text-[#858585] aria-disabled:border-[#303030] aria-disabled:shadow-none aria-disabled:opacity-100 " +
  "[fieldset:disabled_&]:bg-[#202020] [fieldset:disabled_&]:text-[#858585] [fieldset:disabled_&]:border-[#303030] [fieldset:disabled_&]:shadow-none [fieldset:disabled_&]:opacity-100";

const base =
  "cp-btn inline-flex items-center justify-center gap-[7px] min-h-[38px] max-[650px]:min-h-[44px] " +
  "px-[13px] py-2 rounded-[9px] border border-transparent " +
  "text-[13px] font-semibold leading-[1.3] whitespace-nowrap " +
  "transition-[background-color,border-color,box-shadow] duration-150 [&_svg]:flex-none";

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-accent-fill border-[#8351dd] text-white",
    "shadow-[inset_0_1px_0_#ffffff12,0_2px_4px_#0005,0_3px_12px_#6d28d91a]",
    "hover:not-disabled:bg-accent-fill-hover hover:not-disabled:shadow-[inset_0_1px_0_#ffffff18,0_3px_12px_#6d28d92a]",
    inert,
  ),
  secondary: cn(
    "bg-raised border-line text-ink",
    "hover:not-disabled:border-[#454545] hover:not-disabled:bg-[#202020]",
    inert,
  ),
  ghost: cn("bg-transparent text-muted", "hover:not-disabled:bg-raised hover:not-disabled:text-ink", inert),
  danger: cn(
    "bg-danger-fill border-[#dc3b3b] text-white",
    "shadow-[inset_0_1px_0_#ffffff12,0_2px_4px_#0005,0_3px_12px_color-mix(in_srgb,var(--color-danger-fill)_10%,transparent)]",
    "hover:not-disabled:bg-danger-fill-hover hover:not-disabled:shadow-[inset_0_1px_0_#ffffff18,0_3px_12px_color-mix(in_srgb,var(--color-danger-fill)_17%,transparent)]",
    // The shared focus ring is the accent colour, which on a red destructive button is
    // the one purple left on it. Same ring, matched to the control.
    "focus-visible:outline-danger",
    inert,
  ),
};

const small = "cp-btn-sm min-h-[32px] max-[650px]:min-h-[36px] px-[9px] py-1.5 text-xs";

export function buttonClass(
  { variant = "secondary", size, className }: { variant?: ButtonVariant; size?: "small"; className?: string } = {},
) {
  return cn(base, variants[variant], size === "small" && small, className);
}

type ButtonProps = ComponentPropsWithRef<"button"> & { variant?: ButtonVariant; size?: "small" };

export function Button({ variant, size, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...rest} />;
}
