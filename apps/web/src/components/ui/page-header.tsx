"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardIcon } from "../dashboard/dashboard-icon";
import { DashboardUserMenu } from "../dashboard/dashboard-user-menu";
import { useChangeDemoRole, useDemoRole } from "../workspace";
import styles from "./page-header.module.css";

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
    <div className={styles.controls}>{actions}<DashboardUserMenu role={role} onRoleChange={onRoleChange} /></div>
  </header>;
}
