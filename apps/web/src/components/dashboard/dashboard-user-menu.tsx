"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { DemoRole } from "@clearpath/contracts";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-shell.module.css";

const roles: { value: DemoRole; label: string }[] = [
  { value: "reviewer", label: "Reviewer" },
  { value: "submitter", label: "Submitter" },
];

/** Demo identity only: there is no authentication behind this menu. */
export function DashboardUserMenu({ role, onRoleChange }: { role: DemoRole; onRoleChange: (role: DemoRole) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const roleLabel = roles.find((option) => option.value === role)?.label ?? "Reviewer";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={styles.userMenu}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button ref={triggerRef} type="button" className={styles.userTrigger} aria-label={`Demo user, role: ${roleLabel}`} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((value) => !value)}>
        <DashboardIcon name="circle-user" size={23} />
      </button>
      {open && (
        <div id={panelId} className={styles.userPanel}>
          <div className={styles.roleControl} role="group" aria-label="Demo role">
            <span className={styles.roleLabel}>Demo role</span>
            <div className={styles.roleOptions}>
              {roles.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={role === option.value}
                  onClick={() => {
                    onRoleChange(option.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.userLinks}>
            <Link href="/new" onClick={() => setOpen(false)}>New submission</Link>
            <Link href="/catalog" onClick={() => setOpen(false)}>Offer library</Link>
          </div>
          <p className={styles.userNote}>Fictional demo workspace. No sign-in or account.</p>
        </div>
      )}
    </div>
  );
}

