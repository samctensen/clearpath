"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { DashboardIcon } from "../dashboard/dashboard-icon";
import styles from "./custom-select.module.css";

type SelectOption = { value: string; label: string; disabled?: boolean; description?: string };
type CustomSelectProps = {
  id?: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

/** Select-only combobox: focus stays on the trigger while its listbox is open. */
export function CustomSelect({ id, label, value, options, onChange, disabled = false, className }: CustomSelectProps) {
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

  return <div className={[styles.root, className].filter(Boolean).join(" ")}>
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
      disabled={isDisabled}
      className={styles.trigger}
      onClick={() => expanded ? closeList() : openList()}
      onKeyDown={onKeyDown}
      onBlur={event => {
        if (!listRef.current?.contains(event.relatedTarget as Node | null)) closeList();
      }}
    >
      <span className={styles.value}>{selected?.label ?? (value || "Choose an option")}</span>
      <DashboardIcon name="chevron-down" size={12} className={styles.chevron} />
    </button>
    {expanded && createPortal(<ul ref={listRef} id={listId} role="listbox" aria-label={label} className={styles.popup} style={position}>
      {options.map((option, index) => <li
        id={`${listId}-${index}`}
        key={option.value}
        role="option"
        aria-selected={option.value === value}
        aria-disabled={option.disabled || undefined}
        className={`${styles.option} ${index === active ? styles.active : ""}`}
        onPointerDown={event => event.preventDefault()}
        onPointerMove={() => { if (!option.disabled) setActiveIndex(index); }}
        onClick={() => choose(index)}
      >
        <span className={styles.optionText}><span>{option.label}</span>{option.description && <small>{option.description}</small>}</span>
        {option.value === value && <span className={styles.selectedMark} aria-hidden="true">✓</span>}
      </li>)}
    </ul>, document.body)}
  </div>;
}
