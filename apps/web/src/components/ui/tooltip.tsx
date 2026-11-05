"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "./cn";

/**
 * Hover and focus tooltip for a short explanation of what a cell already shows.
 *
 * The bubble is portalled and positioned like the select listbox, because the queue
 * panel clips its overflow and would cut an absolutely positioned tip. Assistive
 * technology reads the sibling description instead of the bubble, so the text is
 * available whether or not a pointer ever hovers the trigger.
 */
export function Tooltip({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const describedBy = `${useId()}-tip`;
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const viewport = window.visualViewport;
      const leftEdge = viewport?.offsetLeft ?? 0;
      const topEdge = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const margin = 12;
      const gap = 8;
      if (rect.bottom < topEdge + margin || rect.top > topEdge + viewportHeight - margin) {
        setOpen(false);
        return;
      }
      const width = Math.min(280, Math.max(0, viewportWidth - margin * 2));
      const above = rect.top - topEdge - margin - gap;
      const below = topEdge + viewportHeight - rect.bottom - margin - gap;
      const up = above >= 96 || above >= below;
      setPosition({
        width,
        left: Math.max(leftEdge + margin, Math.min(rect.left + rect.width / 2 - width / 2, leftEdge + viewportWidth - width - margin)),
        top: up ? rect.top - gap : rect.bottom + gap,
        transform: up ? "translateY(-100%)" : undefined,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [open]);

  // Escape closes the tip without leaving the row, and a tap elsewhere dismisses the
  // one a touch pointer opened, where there is no pointer to leave with.
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !triggerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [open]);

  return <>
    <span
      ref={triggerRef}
      tabIndex={0}
      aria-describedby={describedBy}
      className={cn("inline-block rounded-md focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >{children}</span>
    <span id={describedBy} className="sr-only">{label}</span>
    {open && createPortal(<span
      role="presentation"
      aria-hidden="true"
      style={position}
      className="fixed z-[1000] box-border px-2.5 py-2 rounded-lg border border-[#363636] bg-raised text-ink text-xs leading-[1.45] shadow-[0_16px_40px_#0009,0_2px_8px_#0005] pointer-events-none"
    >{label}</span>, document.body)}
  </>;
}
