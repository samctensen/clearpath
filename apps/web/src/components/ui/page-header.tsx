"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardIcon } from "../dashboard/dashboard-icon";
import { DashboardUserMenu } from "../dashboard/dashboard-user-menu";
import { useChangeDemoRole, useDemoRole } from "../workspace";
import styles from "./page-header.module.css";

/** The one search field every page puts in its header, so the pages cannot drift apart. */
export function HeaderSearch({ label, placeholder, value, onChange, maxLength }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  return <label className={styles.search}>
    <DashboardIcon name="magnifying-glass" size={15} />
    <span className="sr-only">{label}</span>
    <input
      type="search"
      maxLength={maxLength}
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>;
}

/**
 * Every page's header. `actions` holds the page's own search and filters; the demo
 * identity menu is always last, in the same place on every page.
 */
export function PageHeader({ title, description, back, actions, children }: {
  title: string;
  description?: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const role = useDemoRole();
  const onRoleChange = useChangeDemoRole();
  return <header className={styles.header}>
    <div className={styles.identity}>
      {back && <Link className={styles.back} href={back.href}><DashboardIcon name="arrow-left" size={12} />{back.label}</Link>}
      <div className={styles.heading}><h1>{title}</h1>{children}</div>
      {description && <p className={styles.description}>{description}</p>}
    </div>
    {actions && <div className={styles.actions}>{actions}</div>}
    <div className={styles.account}><DashboardUserMenu role={role} onRoleChange={onRoleChange} /></div>
  </header>;
}
