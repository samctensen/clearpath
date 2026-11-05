"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { DraftRetention } from "@/lib/submission-draft";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import { Button } from "./ui";
import { discardArea, discardButton, draftDialog } from "./draft-safety";

export type ActiveDraft = { dirty: boolean; busy: boolean; retain: () => DraftRetention; discard: () => void };
type DraftGuard = {
  register: (read: () => ActiveDraft) => () => void;
  requestLeave: (action: () => void, leavesDocument?: boolean) => void;
  sync: () => void;
};
const DraftGuardContext = createContext<DraftGuard | null>(null);

export function useDraftGuard() {
  const guard = useContext(DraftGuardContext);
  if (!guard) throw new Error("Draft protection requires Workspace");
  return guard;
}

// Navigation API is feature-detected because older browsers only expose popstate,
// which cannot be cancelled. Scoped recovery still protects those history exits.
type TraversalEvent = Event & { navigationType: string; hashChange: boolean; destination: { key: string; url: string; sameDocument: boolean } };
type NavigationApi = EventTarget & { traverseTo: (key: string) => { committed: Promise<unknown>; finished: Promise<unknown> } };

export function DraftGuardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const active = useRef<(() => ActiveDraft) | null>(null);
  const allowExit = useRef(false);
  const allowUnload = useRef(false);
  const requested = useRef<(() => void) | null>(null);
  const [prompt, setPrompt] = useState<LeavePrompt | null>(null);
  const register = useCallback((read: () => ActiveDraft) => {
    active.current = read;
    return () => {
      if (active.current !== read) return;
      active.current = null;
      requested.current = null;
      setPrompt(null);
    };
  }, []);
  const sync = useCallback(() => {
    setPrompt(current => {
      if (!current?.busy || active.current?.().busy) return current;
      requested.current = null;
      return null;
    });
  }, []);
  const requestLeave = useCallback((action: () => void, leavesDocument = false) => {
    const draft = active.current?.();
    if (!draft?.dirty && !draft?.busy) { action(); return; }
    if (requested.current) return;
    requested.current = action;
    setPrompt({ retention: draft.retain(), leavesDocument, busy: draft.busy });
  }, []);
  const value = useMemo(() => ({ register, requestLeave, sync }), [register, requestLeave, sync]);

  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, window.location.href);
      if (!/^https?:$/.test(url.protocol) || (url.pathname === window.location.pathname && url.search === window.location.search && url.origin === window.location.origin)) return;
      const draft = active.current?.();
      if (!draft?.dirty && !draft?.busy) return;
      event.preventDefault();
      event.stopPropagation();
      requestLeave(() => {
        if (url.origin === window.location.origin) router.push(`${url.pathname}${url.search}${url.hash}`);
        else window.location.assign(url.href);
      }, url.origin !== window.location.origin);
    };
    const unload = (event: BeforeUnloadEvent) => {
      const draft = active.current?.();
      if (allowUnload.current || (!draft?.dirty && !draft?.busy)) return;
      draft.retain();
      event.preventDefault();
      event.returnValue = "";
    };
    const navigation = (window as Window & { navigation?: NavigationApi }).navigation;
    const traverse = (baseEvent: Event) => {
      const event = baseEvent as TraversalEvent;
      const draft = active.current?.();
      if (allowExit.current || event.navigationType !== "traverse" || event.hashChange || !event.cancelable || (!draft?.dirty && !draft?.busy)) return;
      event.preventDefault();
      requestLeave(() => {
        const result = navigation?.traverseTo(event.destination.key);
        void result?.committed.catch(() => {});
        void result?.finished.catch(() => {});
      }, !event.destination.sameDocument);
    };
    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", unload);
    navigation?.addEventListener("navigate", traverse);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("beforeunload", unload);
      navigation?.removeEventListener("navigate", traverse);
    };
  }, [requestLeave, router]);

  function stay() { requested.current = null; setPrompt(null); }
  function leave(discard: boolean) {
    const draft = active.current?.();
    if (draft?.busy) return;
    const retention = draft?.retain() ?? "session";
    if (discard) draft?.discard();
    else if (prompt?.leavesDocument && retention === "memory") { setPrompt({ ...prompt, retention }); return; }
    const action = requested.current;
    requested.current = null;
    setPrompt(null);
    // Bypass only the already-confirmed traversal/unload, not later interactions.
    allowExit.current = true;
    allowUnload.current = discard || retention === "session";
    action?.();
    window.setTimeout(() => { allowExit.current = false; allowUnload.current = false; }, 300);
  }

  return <DraftGuardContext.Provider value={value}>{children}{prompt && <LeaveDraftDialog prompt={prompt} onStay={stay} onLeave={leave} />}</DraftGuardContext.Provider>;
}

type LeavePrompt = { retention: DraftRetention; leavesDocument: boolean; busy: boolean };

function LeaveDraftDialog({ prompt, onStay, onLeave }: { prompt: LeavePrompt; onStay: () => void; onLeave: (discard: boolean) => void }) {
  const canKeep = !prompt.leavesDocument || prompt.retention === "session";
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const stay = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const controlledId = previous?.closest("[id]")?.id;
    const fallback = controlledId ? document.querySelector<HTMLElement>(`[aria-controls="${CSS.escape(controlledId)}"]`) : null;
    const element = dialog.current;
    element?.showModal();
    stay.current?.focus({ preventScroll: true });
    return () => { element?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); else if (fallback?.isConnected) fallback.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={dialog} className={draftDialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); onStay(); }}>
    <header><DashboardIcon name="file-lines" size={21} /><h2 id={`${id}-title`}>{prompt.busy ? "Submission in progress" : "Leave this draft?"}</h2></header>
    <p id={`${id}-description`}>{prompt.busy ? "Wait for the submission to finish before leaving or switching roles." : !canKeep ? "This draft is only kept while the app stays open. Leaving this page would lose it. Keep editing, or explicitly discard your changes to leave." : prompt.retention === "memory" ? "Your draft will stay available as you move within this app. Reloading or closing the tab may lose it. Nothing is submitted when you leave." : "Your unsent changes can stay in this tab for you to resume. Nothing is submitted when you leave."}{!prompt.busy && " Discarding removes these unsent changes."}</p>
    <footer>
      <Button ref={stay} variant="secondary" onClick={onStay}>Keep editing</Button>
      {!prompt.busy && <><Button variant="primary" disabled={!canKeep} onClick={() => onLeave(false)}>Keep draft and leave</Button><div className={discardArea}><Button variant="ghost" className={discardButton} onClick={() => onLeave(true)}>Discard draft</Button></div></>}
    </footer>
  </dialog>;
}
