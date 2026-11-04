"use client";

import { useEffect, useRef, useState } from "react";
import type { SubmissionInput } from "@clearpath/contracts";
import { useDraftGuard, type ActiveDraft } from "@/components/draft-guard";
import { createSubmissionDraft, draftInputsEqual, submissionDraftRecovery, type DraftRetention, type StoredSubmissionDraft } from "./submission-draft";

export function useSubmissionDraft(initial: SubmissionInput, revision: number | undefined, scope: string, busy: boolean) {
  const { register, requestLeave, sync } = useDraftGuard();
  const [baseline, setBaseline] = useState(() => createSubmissionDraft(initial, revision));
  const [input, setInput] = useState(baseline);
  const [expectedRevision, setExpectedRevision] = useState(revision);
  const [baselineRevision, setBaselineRevision] = useState(revision);
  const [recovery, setRecovery] = useState<StoredSubmissionDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [restored, setRestored] = useState(false);
  const completed = useRef(false);
  const dirty = !draftInputsEqual(input, baseline) || expectedRevision !== baselineRevision;

  function storage() {
    try { return window.sessionStorage; } catch { return null; }
  }
  function retain(): DraftRetention {
    if (completed.current) return "session";
    if (!dirty && !recovery) { submissionDraftRecovery.remove(storage(), scope); return "session"; }
    // A pending Restore/Discard choice still owns the only unsent copy. Persist
    // that recovery payload, never the untouched baseline shown underneath it.
    const retained = submissionDraftRecovery.write(storage(), scope, recovery?.input ?? input, recovery ? recovery.baseRevision ?? undefined : expectedRevision);
    setStorageFailed(retained === "memory");
    return retained;
  }
  function clear() { submissionDraftRecovery.remove(storage(), scope); }
  function discard() {
    clear();
    setRecovery(null);
    setInput(baseline);
    setExpectedRevision(baselineRevision);
    setRestored(false);
  }
  const active = useRef<ActiveDraft>({ dirty: dirty || recovery !== null, busy, retain, discard });
  active.current = { dirty: !completed.current && (dirty || recovery !== null), busy, retain, discard };
  useEffect(() => register(() => active.current), [register]);
  useEffect(() => { sync(); }, [busy, sync]);

  useEffect(() => {
    try {
      const draft = submissionDraftRecovery.read(storage(), scope);
      if (draft && (!draftInputsEqual(draft.input, baseline) || draft.baseRevision !== (revision ?? null))) setRecovery(draft);
    } catch { setStorageFailed(true); }
    setReady(true);
    // A form instance is scoped by its case/new-form key and starting revision.
    // Do not replace an in-progress draft when parent data refreshes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  useEffect(() => { if (ready && !completed.current) active.current.retain(); }, [input, expectedRevision, ready, recovery]);

  function restore() {
    if (!recovery) return;
    setInput(recovery.input);
    setExpectedRevision(recovery.baseRevision ?? undefined);
    setRecovery(null);
    setRestored(true);
  }
  function acceptLatest(input: SubmissionInput, revision: number) {
    // Deliberate confirmation updates the save gate; user text remains untouched.
    setBaseline(createSubmissionDraft(input, revision));
    setExpectedRevision(revision);
    setBaselineRevision(revision);
  }
  function saved() {
    completed.current = true;
    active.current.dirty = false;
    active.current.busy = false;
    clear();
    sync();
  }

  return { input, setInput, expectedRevision, recovery, ready, dirty, restored, storageFailed, restore, discard, acceptLatest, saved, requestLeave };
}
