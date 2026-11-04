"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { DemoRole } from "@clearpath/contracts";
import { DashboardShell } from "./dashboard/dashboard-shell";
import { DraftGuardProvider, useDraftGuard } from "./draft-guard";

const roleKey = "clearpath-demo-role";
const RoleContext = createContext<DemoRole>("reviewer");
const RoleChangeContext = createContext<((role: DemoRole) => void) | null>(null);

export function useDemoRole() {
  return useContext(RoleContext);
}

export function useChangeDemoRole() {
  const changeRole = useContext(RoleChangeContext);
  if (!changeRole) throw new Error("Demo role controls require Workspace");
  return changeRole;
}

export function Workspace({ children }: { children: ReactNode }) {
  return <DraftGuardProvider><WorkspaceContent>{children}</WorkspaceContent></DraftGuardProvider>;
}

function WorkspaceContent({ children }: { children: ReactNode }) {
  const { requestLeave } = useDraftGuard();
  const [role, setRole] = useState<DemoRole>("reviewer");

  useEffect(() => {
    if (window.localStorage.getItem(roleKey) === "submitter") setRole("submitter");
  }, []);

  function changeRole(next: DemoRole) {
    if (next === role) return;
    requestLeave(() => {
      setRole(next);
      window.localStorage.setItem(roleKey, next);
    });
  }

  return (
    <RoleContext.Provider value={role}>
      <RoleChangeContext.Provider value={changeRole}>
        <DashboardShell role={role}>{children}</DashboardShell>
      </RoleChangeContext.Provider>
    </RoleContext.Provider>
  );
}
