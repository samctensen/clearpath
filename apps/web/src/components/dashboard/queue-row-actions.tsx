"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { CaseStatus, DemoRole } from "@clearpath/contracts";
import type { QueueAction } from "./queue-action-dialog";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./queue-row-actions.module.css";

export function QueueRowActions({ caseId, title, status, role, onAction }: {
  caseId: string;
  title: string;
  status: CaseStatus;
  role: DemoRole;
  onAction: (action: QueueAction, trigger: HTMLButtonElement | null) => void;
}) {
  const canDecide = role === "reviewer" && (status === "ready_for_review" || status === "needs_information");
  const canDelete = role === "submitter" && status !== "approved";
  function begin(action: QueueAction) {
    close(true);
    onAction(action, trigger.current);
  }
  const href = `/cases/${encodeURIComponent(caseId)}`;
  const menuId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const initialFocus = useRef<"first" | "last">("first");
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>({ top: 0, left: 0, width: 208 });
  const [notice, setNotice] = useState("");

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!trigger.current || !panel.current) return;
      const rect = trigger.current.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0;
      const top = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      const menuWidth = Math.min(208, width - 24);
      const menuHeight = panel.current.getBoundingClientRect().height;
      if (rect.bottom < top || rect.top > top + height || rect.right < left || rect.left > left + width) {
        setOpen(false);
        return;
      }
      const below = top + height - rect.bottom - 12;
      const above = rect.top - top - 12;
      const down = below >= menuHeight + 6 || below >= above;
      setPosition({ width: menuWidth, left: Math.max(left + 12, Math.min(rect.right - menuWidth, left + width - menuWidth - 12)), top: down ? rect.bottom + 6 : rect.top - 6, maxHeight: Math.max(0, (down ? below : above) - 6), transform: down ? undefined : "translateY(-100%)" });
    };
    place();
    const items = panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
    (initialFocus.current === "last" ? items?.[items.length - 1] : items?.[0])?.focus({ preventScroll: true });
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

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  function onMenuKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); return; }
    // Return to the trigger before native Tab advances through the table.
    if (event.key === "Tab") { close(true); return; }
    if (event.key === " " && event.target instanceof HTMLAnchorElement) { event.preventDefault(); event.target.click(); return; }
    const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? (current + 1) % items.length : event.key === "ArrowUp" ? (current - 1 + items.length) % items.length : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : -1;
    if (next >= 0) { event.preventDefault(); items[next]?.focus(); }
  }

  async function copyLink() {
    close(true);
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).href);
      setNotice("Review link copied");
    } catch {
      setNotice("Couldn’t copy link. Open the review and copy its address.");
    }
  }

  return <div className={styles.root}>
    <button ref={trigger} type="button" className={styles.trigger} aria-label={`Actions for ${title}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => { initialFocus.current = "first"; setOpen(value => !value); }}
      onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); initialFocus.current = event.key === "ArrowUp" ? "last" : "first"; setOpen(true); } }}>
      <DashboardIcon name="ellipsis" size={18} />
    </button>
    {open && createPortal(<div ref={panel} id={menuId} role="menu" aria-label={`Actions for ${title}`} className={styles.menu} style={position} onKeyDown={onMenuKey}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null) && !trigger.current?.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
      {canDecide && <>
        <button role="menuitem" tabIndex={-1} type="button" onClick={() => begin("approve")}><DashboardIcon name="check" size={15} />Approve copy</button>
        <button role="menuitem" tabIndex={-1} type="button" onClick={() => begin("request_changes")}><DashboardIcon name="message-plus" size={15} />Request changes</button>
      </>}
      {role === "submitter" && <Link role="menuitem" tabIndex={-1} href={`${href}?intent=revise`} onClick={() => close()}><DashboardIcon name="pen" size={15} />Revise submission</Link>}
      {canDelete && <button role="menuitem" tabIndex={-1} type="button" className={styles.danger} onClick={() => begin("delete")}><DashboardIcon name="trash-can" size={15} />Delete submission</button>}
      {(canDecide || role === "submitter") && <div className={styles.separator} role="separator" />}
      <Link role="menuitem" tabIndex={-1} href={href} onClick={() => close()}><DashboardIcon name="file-lines" size={15} />{role === "submitter" ? "Open submission" : "Open review"}</Link>
      <a role="menuitem" tabIndex={-1} href={href} target="_blank" rel="noopener noreferrer" onClick={() => close(true)}><DashboardIcon name="arrow-up-right" size={15} />Open in new tab</a>
      <button role="menuitem" tabIndex={-1} type="button" onClick={copyLink}><DashboardIcon name="link" size={15} />Copy review link</button>
    </div>, document.body)}
    {notice && createPortal(<div className={styles.notice} role="status">{notice}</div>, document.body)}
  </div>;
}
