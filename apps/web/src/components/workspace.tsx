"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChevronRight, ClipboardList, FlaskConical, ShieldCheck } from "lucide-react";
import type { DemoRole } from "@clearpath/contracts";

const roleKey = "clearpath-demo-role";
const RoleContext = createContext<DemoRole>("reviewer");

export function useDemoRole() {
  return useContext(RoleContext);
}

export function Workspace({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [role, setRole] = useState<DemoRole>("reviewer");

  useEffect(() => {
    if (window.localStorage.getItem(roleKey) === "submitter") setRole("submitter");
  }, []);

  function changeRole(next: DemoRole) {
    setRole(next);
    window.localStorage.setItem(roleKey, next);
  }

  const isLibrary = path.startsWith("/catalog");
  const section = isLibrary ? "Offer library" : "Review queue";
  const subpage = path === "/new" ? "New submission" : path.startsWith("/cases/") ? "Submission" : null;

  return (
    <RoleContext.Provider value={role}>
      <div className="workspace">
        <a className="skip-link" href="#main">Skip to content</a>
        <aside className="sidebar">
          <Link href="/" className="brand" aria-label="ClearPath home">
            <span className="brand-mark"><ShieldCheck size={23} strokeWidth={2.1} aria-hidden="true" /></span>
            <span>ClearPath<span className="brand-caption">Compliance workspace</span></span>
          </Link>
          <nav className="sidebar-nav" aria-label="Workspace">
            <Link href="/" className={!isLibrary ? "nav-link selected" : "nav-link"} aria-current={path === "/" ? "page" : undefined}>
              <ClipboardList size={19} aria-hidden="true" />Review queue
            </Link>
            <Link href="/catalog" className={isLibrary ? "nav-link selected" : "nav-link"} aria-current={isLibrary ? "page" : undefined}>
              <BookOpen size={19} aria-hidden="true" />Offer library
            </Link>
          </nav>
          <div className="sidebar-footer">
            <FlaskConical size={17} aria-hidden="true" />
            <div><strong>Demo workspace</strong><span>Fictional offers and copy</span></div>
          </div>
        </aside>
        <div className="workspace-body">
          <header className="topbar">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              {subpage ? <><Link href="/">{section}</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{subpage}</span></> : <span aria-current="page">{section}</span>}
            </nav>
            <div className="role-control" role="group" aria-label="Demo role">
              <span className="role-label">Demo role</span>
              <div className="role-options">
                <button type="button" aria-pressed={role === "reviewer"} onClick={() => changeRole("reviewer")}>Reviewer</button>
                <button type="button" aria-pressed={role === "submitter"} onClick={() => changeRole("submitter")}>Submitter</button>
              </div>
            </div>
          </header>
          <main id="main" className="main-content">{children}</main>
        </div>
      </div>
    </RoleContext.Provider>
  );
}
