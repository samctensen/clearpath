"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ErrorMessage, buttonClass } from "./ui";

export function CaseRefreshDialog({ onRefresh, onClose }: { onRefresh: () => Promise<boolean>; onClose: () => void }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    cancel.current?.focus({ preventScroll: true });
    return () => { element?.close(); if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);

  async function refresh() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      if (await onRefresh()) onClose();
      else setError("The latest submission could not be loaded. Your open work is unchanged.");
    } finally { setPending(false); }
  }

  return <dialog ref={dialog} className="w-[min(480px,calc(100vw-32px))] p-6 m-auto rounded-[18px] border border-[#303030] bg-[#141414] text-ink shadow-[0_24px_80px_#0008] backdrop:bg-[#0009] [&>h2]:mt-0 [&>h2]:mb-3 [&>h2]:text-xl [&>p]:text-[#aaa] [&>p]:leading-[1.6] [&>footer]:flex [&>footer]:justify-end [&>footer]:flex-wrap [&>footer]:gap-2.5 [&>footer]:mt-6" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); if (!pending) onClose(); }}>
    <h2 id={`${id}-title`}>Load latest submission?</h2>
    <p id={`${id}-description`}>This replaces the open review with the latest saved activity. Unsent review notes will be cleared. Any saved submission draft stays available to resume.</p>
    {error && <ErrorMessage message={error} />}
    <footer><button ref={cancel} type="button" className={buttonClass({ variant: "secondary" })} disabled={pending} onClick={onClose}>Keep working</button><button type="button" className={buttonClass({ variant: "primary" })} disabled={pending} onClick={() => void refresh()}>{pending ? "Loading…" : "Load latest"}</button></footer>
  </dialog>;
}
