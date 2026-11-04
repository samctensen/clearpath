"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-shell.module.css";

const navItems = [
  { href: "/", label: "Review desk", icon: "grid-2" },
  { href: "/decisions", label: "Decision log", icon: "clock" },
  { href: "/catalog", label: "Offer library", icon: "book-open" },
  { href: "/policies", label: "Policy guide", icon: "shield-check" },
];

/** A path that turns once and lands on an arrow: submission → decision. */
function Wordmark() {
  return (
    <svg className={styles.mark} viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
      <rect x=".5" y=".5" width="31" height="31" rx="8" className={styles.markFrame} />
      <path d="M7 23H15V9H23" className={styles.markPath} />
      <path d="M20 5.6L24.4 9L20 12.4" className={styles.markHead} />
      <rect x="5.5" y="21.5" width="3" height="3" className={styles.markStart} />
    </svg>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navigationOpen, setNavigationOpen] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  const navigationId = useId();

  useEffect(() => {
    if (!navigationOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!sidebar.current?.contains(event.target as Node)) setNavigationOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [navigationOpen]);

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">Skip to content</a>
      <aside ref={sidebar} className={styles.sidebar} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setNavigationOpen(false); }} onKeyDown={event => {
        if (event.key === "Escape" && navigationOpen) { event.preventDefault(); setNavigationOpen(false); navigationTrigger.current?.focus(); }
      }}>
        <div className={styles.brandRow}>
        <Link href="/" className={styles.brand} aria-label="ClearPath home" onClick={() => setNavigationOpen(false)}>
          <Wordmark />
          <span className={styles.brandText}>
            <span className={styles.wordmark}>Clear<b>Path</b></span>
            <span className={styles.caption}>Compliance workspace</span>
          </span>
        </Link>
        <button ref={navigationTrigger} type="button" className={styles.navigationTrigger} aria-label={navigationOpen ? "Close navigation" : "Open navigation"} aria-expanded={navigationOpen} aria-controls={navigationId} onClick={() => setNavigationOpen(value => !value)}>
          <DashboardIcon name={navigationOpen ? "xmark" : "bars"} size={18} />
        </button>
        </div>
        <nav id={navigationId} className={styles.nav} aria-label="Workspace" data-open={navigationOpen}>
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className={styles.navLink} onClick={() => setNavigationOpen(false)} aria-current={(item.href === "/" ? pathname === "/" || pathname.startsWith("/cases/") || pathname === "/new" : pathname === item.href || pathname.startsWith(`${item.href}/`)) ? "page" : undefined}>
              <DashboardIcon name={item.icon} size={15} className={styles.navIcon} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.demo}>
          <p><strong>Demo workspace</strong><span>Fictional offers and copy</span></p>
        </div>
      </aside>
      <div className={styles.body}>
        <main id="main" className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
