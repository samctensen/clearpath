"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { DashboardIcon } from "../dashboard/dashboard-icon";
import { cn } from "./cn";

type SelectOption = { value: string; label: string; disabled?: boolean; description?: string };
type CustomSelectProps = {
  id?: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  invalid?: boolean;
  describedBy?: string;
};

/** Select-only combobox: focus stays on the trigger while its listbox is open. */
export function CustomSelect({ id, label, value, options, onChange, disabled = false, className, invalid = false, describedBy }: CustomSelectProps) {
  const generatedId = useId();
  const triggerId = id ?? `select-${generatedId}`;
  const listId = `${triggerId}-options`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef({ text: "", at: 0 });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<CSSProperties>({});
  const selectedIndex = options.findIndex(option => option.value === value);
  const selected = options[selectedIndex];
  const enabled = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
  const isDisabled = disabled || enabled.length === 0;
  const expanded = open && !isDisabled;
  const active = options[activeIndex] && !options[activeIndex].disabled ? activeIndex : enabled[0] ?? -1;

  const closeList = useCallback(() => {
    searchRef.current = { text: "", at: 0 };
    setOpen(false);
  }, []);

  const openList = (edge?: "first" | "last") => {
    if (isDisabled) return;
    searchRef.current = { text: "", at: 0 };
    setActiveIndex(edge === "first" ? enabled[0] : edge === "last" ? enabled.at(-1)!
      : selectedIndex >= 0 && !selected?.disabled ? selectedIndex : enabled[0]);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    closeList();
    if (option.value !== value) onChange(option.value);
  };

  useEffect(() => { if (isDisabled) closeList(); }, [isDisabled, closeList]);

  useLayoutEffect(() => {
    if (!expanded) return;
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
      const gap = 6;
      if (rect.bottom < topEdge + margin || rect.top > topEdge + viewportHeight - margin) {
        closeList();
        return;
      }
      const below = Math.max(0, topEdge + viewportHeight - rect.bottom - margin - gap);
      const above = Math.max(0, rect.top - topEdge - margin - gap);
      const down = below >= Math.min(240, options.length * 44 + 12) || below >= above;
      const maxHeight = Math.min(320, down ? below : above);
      const width = Math.min(Math.max(rect.width, 220), Math.max(0, viewportWidth - margin * 2));
      const left = Math.max(leftEdge + margin, Math.min(rect.left, leftEdge + viewportWidth - width - margin));
      setPosition({
        left, width, maxHeight,
        top: down ? rect.bottom + gap : rect.top - gap,
        transform: down ? undefined : "translateY(-100%)",
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
  }, [expanded, options.length, closeList]);

  useEffect(() => {
    if (!expanded) return;
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !triggerRef.current?.contains(event.target) && !listRef.current?.contains(event.target)) closeList();
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [expanded, closeList]);

  useEffect(() => {
    if (!expanded) return;
    const option = listRef.current?.children[active] as HTMLElement | undefined;
    // Scroll only the popup, never the page behind it.
    const list = listRef.current;
    if (option && list) {
      if (option.offsetTop < list.scrollTop) list.scrollTop = option.offsetTop;
      else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight;
      }
    }
  }, [active, expanded]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    if (event.key === "Tab") { closeList(); return; }
    if (event.key === "Escape") {
      if (expanded) { event.preventDefault(); event.stopPropagation(); closeList(); }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!expanded) { openList(event.key === "ArrowUp" && selectedIndex < 0 ? "last" : undefined); return; }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const current = enabled.indexOf(active);
      setActiveIndex(enabled[(current + direction + enabled.length) % enabled.length]);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      openList(event.key === "Home" ? "first" : "last");
      return;
    }
    const now = Date.now();
    const previous = now - searchRef.current.at <= 700 ? searchRef.current.text : "";
    if (event.key === "Enter" || (event.key === " " && (!expanded || !previous))) {
      event.preventDefault();
      if (expanded) choose(active); else openList();
      return;
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    const text = previous + event.key.toLocaleLowerCase();
    searchRef.current = { text, at: now };
    const repeated = Array.from(text).every(character => character === text[0]);
    const query = repeated ? text[0] : text;
    const start = expanded ? active : selectedIndex;
    const ordered = [...enabled.filter(index => index > start), ...enabled.filter(index => index <= start)];
    // Keep a multi-character match on the current option; repeated letters cycle.
    if (!repeated && expanded && options[active]?.label.toLocaleLowerCase().startsWith(query)) return;
    const match = ordered.find(index => options[index].label.toLocaleLowerCase().startsWith(query));
    if (!expanded) setActiveIndex(selectedIndex >= 0 && !selected?.disabled ? selectedIndex : enabled[0]);
    if (match !== undefined) setActiveIndex(match);
    setOpen(true);
  };

  return <div className={cn("min-w-0", className)}>
    <button
      ref={triggerRef}
      id={triggerId}
      type="button"
      role="combobox"
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={expanded}
      aria-controls={expanded ? listId : undefined}
      aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      disabled={isDisabled}
      className="group relative flex items-center w-full min-w-0 min-h-[36px] max-[650px]:min-h-[44px] pl-3 pr-[38px] py-2 rounded-lg border border-line bg-raised text-ink text-[13px] max-[650px]:text-base font-medium leading-[1.4] text-left shadow-none transition-[border-color,background-color] duration-[140ms] ease-out hover:not-disabled:border-[#484848] focus-visible:outline-none focus-visible:border-accent aria-[invalid=true]:border-danger aria-expanded:border-accent aria-expanded:outline-2 aria-expanded:outline-[color-mix(in_srgb,var(--color-accent)_23%,transparent)] aria-expanded:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55"
      onClick={() => expanded ? closeList() : openList()}
      onKeyDown={onKeyDown}
      onBlur={event => {
        if (!listRef.current?.contains(event.relatedTarget as Node | null)) closeList();
      }}
    >
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{selected?.label ?? (value || "Choose an option")}</span>
      <DashboardIcon name="chevron-down" size={12} className="absolute top-1/2 right-[13px] -translate-y-1/2 text-muted transition-transform duration-[140ms] ease-out group-aria-expanded:rotate-180" />
    </button>
    {expanded && createPortal(<ul ref={listRef} id={listId} role="listbox" aria-label={label} className="fixed z-[1000] m-0 p-[5px] box-border overflow-y-auto overscroll-contain list-none rounded-[10px] border border-[#363636] bg-raised text-ink font-[inherit] shadow-[0_16px_40px_#0009,0_2px_8px_#0005] [scrollbar-width:thin] [scrollbar-color:#484848_transparent]" style={position}>
      {options.map((option, index) => <li
        id={`${listId}-${index}`}
        key={option.value}
        role="option"
        aria-selected={option.value === value}
        aria-disabled={option.disabled || undefined}
        className={cn("flex items-center gap-3 min-h-[38px] max-[650px]:min-h-[44px] px-2.5 py-[9px] rounded-md border border-transparent text-[13px] max-[650px]:text-[15px] leading-[1.4] cursor-pointer aria-selected:text-[#c7b0f7] aria-disabled:opacity-40 aria-disabled:cursor-not-allowed", index === active && "border-[#383838] bg-[#252525]")}
        onPointerDown={event => event.preventDefault()}
        onPointerMove={() => { if (!option.disabled) setActiveIndex(index); }}
        onClick={() => choose(index)}
      >
        <span className="flex-1 min-w-0 [overflow-wrap:anywhere] [&_small]:block [&_small]:mt-[3px] [&_small]:text-muted [&_small]:text-[11.5px] max-[650px]:[&_small]:text-xs [&_small]:font-normal [&_small]:leading-[1.45]"><span>{option.label}</span>{option.description && <small>{option.description}</small>}</span>
        {option.value === value && <span className="flex-none text-accent text-[14px]" aria-hidden="true">✓</span>}
      </li>)}
    </ul>, document.body)}
  </div>;
}
