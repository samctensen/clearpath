"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardIcon } from "../dashboard/dashboard-icon";
import { DashboardUserMenu } from "../dashboard/dashboard-user-menu";
import { useChangeDemoRole, useDemoRole } from "../workspace";

/** The one search field every page puts in its header, so the pages cannot drift apart. */
export function HeaderSearch({ label, placeholder, value, onChange, maxLength }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  return (
    <label className="flex items-center gap-[9px] px-3 rounded-[9px] border border-line bg-raised text-muted transition-[border-color] duration-150 hover:border-muted focus-within:border-accent max-[1180px]:flex-[1_1_220px] max-[650px]:flex-[1_1_100%]">
      <DashboardIcon name="magnifying-glass" size={15} />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-[clamp(170px,17vw,260px)] min-w-0 min-h-[34px] px-0 py-[7px] border-0 bg-transparent text-ink text-[13px] outline-none focus-visible:outline-none placeholder:text-muted placeholder:opacity-100 max-[1180px]:w-full max-[650px]:py-3"
      />
    </label>
  );
}

/**
 * Every page's header. `actions` holds the page's own search and filters; the demo
 * identity menu is always last, in the same place on every page. Below 1180px the
 * controls drop to their own row before the heading has to shrink.
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
  return (
    <header className="grid grid-cols-[minmax(130px,1fr)_auto_auto] items-center gap-x-4 gap-y-2.5 pb-[14px] max-[1180px]:grid-cols-[minmax(0,1fr)_auto]">
      <div className="min-w-0">
        {back && (
          <Link
            className="inline-flex items-center gap-[7px] mb-2.5 text-muted text-xs hover:text-ink"
            href={back.href}
          >
            <DashboardIcon name="arrow-left" size={12} />
            {back.label}
          </Link>
        )}
        <div className="flex items-center flex-wrap gap-x-[14px] gap-y-2.5">
          <h1 className="text-[23px] max-[650px]:text-[26px] font-semibold tracking-[-.03em] leading-[1.1]">{title}</h1>
          {children}
        </div>
        {description && <p className="max-w-[75ch] mt-1.5 text-muted text-[13px]">{description}</p>}
      </div>
      {actions && (
        <div className="flex items-center flex-wrap gap-2 max-[1180px]:col-span-full max-[1180px]:row-start-2 max-[1180px]:w-full">
          {actions}
        </div>
      )}
      <div className="justify-self-end max-[1180px]:col-start-2 max-[1180px]:row-start-1">
        <DashboardUserMenu role={role} onRoleChange={onRoleChange} />
      </div>
    </header>
  );
}
