"use client";

import { useEffect, useRef, useState } from "react";
import { formatLabels, productLabels, type CaseDetail, type Revision } from "@clearpath/contracts";
import { api, errorMessage } from "@/lib/api";
import type { SubmissionDraftInput } from "@/lib/submission-draft";
import { Button, ErrorMessage } from "./ui";
import { dialogActions, draftCompare, draftConfirm, draftCopy, draftNotice } from "./draft-safety";

export function DraftConflictRecovery({ casePath, baseRevision, input, onContinue }: {
  casePath: string; baseRevision?: number; input: SubmissionDraftInput; onContinue: (revision: Revision) => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); heading.current?.scrollIntoView({ block: "nearest" }); }, []);
  const [latest, setLatest] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  async function loadLatest() {
    if (loading) return;
    setLoading(true);
    setError("");
    setConfirmed(false);
    try {
      const detail = await api<CaseDetail>(casePath);
      const revision = detail.revisions.at(-1);
      if (!revision) throw new Error("The latest revision is unavailable. Your draft is still here.");
      setLatest(revision);
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setLoading(false); }
  }
  return <section className={draftNotice} aria-labelledby="draft-conflict-title" aria-busy={loading}>
    <h2 ref={heading} tabIndex={-1} id="draft-conflict-title">The saved submission changed</h2>
    <p>Your draft from revision {baseRevision ?? "unknown"} is preserved below. Review the latest saved revision before continuing. Nothing has been submitted.</p>
    <div className={dialogActions}><Button variant="secondary" disabled={loading} onClick={() => void loadLatest()}>{loading ? "Loading latest revision…" : latest ? "Refresh latest revision" : "Review latest revision"}</Button></div>
    {error && <ErrorMessage message={error} />}
    {latest && <>
      <div className={draftCompare}>
        <DraftSnapshot title={`Latest saved · revision ${latest.number}`} input={latest.input} />
        <DraftSnapshot title="Your unsent draft" input={input} />
      </div>
      <label className={draftConfirm}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} /><span>I reviewed the latest copy and context. Keep all my draft fields to prepare revision {latest.number + 1}.</span></label>
      <div className={dialogActions}><Button variant="primary" disabled={!confirmed || loading} onClick={() => onContinue(latest)}>Continue draft from revision {latest.number}</Button></div>
      <p>You can keep editing and rerun checks before submitting. A later change to the saved revision will require review again.</p>
    </>}
  </section>;
}

function DraftSnapshot({ title, input }: { title: string; input: SubmissionDraftInput }) {
  return <section><h3>{title}</h3><dl>
    <div><dt>Campaign</dt><dd>{input.title || "Untitled"}</dd></div>
    <div><dt>Publisher / partner</dt><dd>{input.publisher || "Unknown"}</dd></div>
    <div><dt>Product · offer</dt><dd>{productLabels[input.productId]} · {input.offerId ?? "Unknown offer"}</dd></div>
    <div><dt>Format · copy provided</dt><dd>{formatLabels[input.format]} · {input.completeAsset === null ? "Not selected" : input.completeAsset ? "Complete asset" : "Excerpt only"}</dd></div>
    <div><dt>Target launch</dt><dd>{input.launchDate || "Not set"}</dd></div>
    {input.format === "banner" && <div><dt>Links to application</dt><dd>{input.linksToApplication === null ? "Unknown" : input.linksToApplication ? "Yes" : "No"}</dd></div>}
    <div><dt>Supporting evidence</dt><dd>{input.substantiation || "None provided"}</dd></div>
  </dl><div className={draftCopy} role="region" aria-label={`${title}, marketing copy`} tabIndex={0}>{input.content || "No copy provided"}</div></section>;
}
