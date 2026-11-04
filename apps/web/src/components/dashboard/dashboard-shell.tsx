"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { DemoRole } from "@clearpath/contracts";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-shell.module.css";

const navItems = [
  { href: "/", label: "Review desk", icon: "grid-2", current: true },
  { href: "/#submissions", label: "Review queue", icon: "list-check", current: false },
  { href: "/catalog", label: "Offer library", icon: "book-open", current: false },
];

const roles: { value: DemoRole; label: string }[] = [
  { value: "reviewer", label: "Reviewer" },
  { value: "submitter", label: "Submitter" },
];

/** A path that turns once and lands on an arrow: submission → decision. */
function Wordmark() {
  return (
    <svg className={styles.mark} viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" focusable="false">
      <rect x=".5" y=".5" width="31" height="31" className={styles.markFrame} />
      <path d="M7 23H15V9H23" className={styles.markPath} />
      <path d="M20 5.6L24.4 9L20 12.4" className={styles.markHead} />
      <rect x="5.5" y="21.5" width="3" height="3" className={styles.markStart} />
    </svg>
  );
}

export function DashboardShell({ children, role, onRoleChange }: { children: ReactNode; role: DemoRole; onRoleChange: (role: DemoRole) => void }) {
  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main">Skip to content</a>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand} aria-label="ClearPath home">
          <Wordmark />
          <span className={styles.brandText}>
            <span className={styles.wordmark}>Clear<b>Path</b></span>
            <span className={styles.caption}>Compliance workspace</span>
          </span>
        </Link>
        <nav className={styles.nav} aria-label="Workspace">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className={styles.navLink} aria-current={item.current ? "page" : undefined}>
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
        <header className={styles.topbar}>
          <p className={styles.context}>
            <span className={styles.contextName}>Demo workspace</span>
            <span className={styles.divider} aria-hidden="true">/</span>
            <span className={styles.contextPage}>Review desk</span>
          </p>
          <div className={styles.roleControl} role="group" aria-label="Demo role">
            <span className={styles.roleLabel}>Demo role</span>
            <div className={styles.roleOptions}>
              {roles.map((option) => (
                <button key={option.value} type="button" aria-pressed={role === option.value} onClick={() => onRoleChange(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </header>
        <main id="main" className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
