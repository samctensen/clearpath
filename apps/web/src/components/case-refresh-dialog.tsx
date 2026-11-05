"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ErrorMessage } from "./ui";
import styles from "./case-refresh-dialog.module.css";

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

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); if (!pending) onClose(); }}>
    <h2 id={`${id}-title`}>Load latest submission?</h2>
    <p id={`${id}-description`}>This replaces the open review with the latest saved activity. Unsent review notes will be cleared. Any saved submission draft stays available to resume.</p>
    {error && <ErrorMessage message={error} />}
    <footer><button ref={cancel} type="button" className="button secondary" disabled={pending} onClick={onClose}>Keep working</button><button type="button" className="button primary" disabled={pending} onClick={() => void refresh()}>{pending ? "Loading…" : "Load latest"}</button></footer>
  </dialog>;
}
