"use client";

import { DashboardIcon } from "./dashboard/dashboard-icon";
import { useState, type FormEvent } from "react";
import { buildChangeRequestFeedback, type CaseDetail, type Disposition, type ManualFinding } from "@clearpath/contracts";
import { ChangeRequestContent } from "./submissions/submission-feedback";
import styles from "./review-actions.module.css";

type Mutate = (path: string, body: object) => Promise<boolean>;

export function FindingActions({ ruleId, confirmationReason, disposition, mutate, pending }: {
  ruleId: string;
  confirmationReason: string;
  disposition?: Disposition;
  mutate?: Mutate;
  pending: boolean;
}) {
  const [dismissing, setDismissing] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="finding-actions">
      {disposition && (
        <p className="disposition"><strong>{disposition.action === "confirmed" ? "Confirmed concern" : "Dismissed"}</strong>{disposition.reason && <span>{disposition.reason}</span>}</p>
      )}
      {mutate && (
        <div className="action-row">
          {disposition?.action !== "confirmed" && (
            <button type="button" className="button secondary small" disabled={pending} onClick={async () => {
              if (await mutate("/dispositions", { ruleId, action: "confirmed", reason: confirmationReason })) setDismissing(false);
            }}><DashboardIcon name="check" size={15} aria-hidden="true" />Confirm concern</button>
          )}
          <button type="button" className="button ghost small" aria-expanded={dismissing} disabled={pending} onClick={() => setDismissing(!dismissing)}>{dismissing ? "Cancel dismissal" : disposition?.action === "dismissed" ? "Update dismissal" : "Dismiss"}</button>
        </div>
      )}
      {mutate && dismissing && (
        <form className="inline-form" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (reason.trim() && await mutate("/dispositions", { ruleId, action: "dismissed", reason })) {
            setDismissing(false);
            setReason("");
          }
        }}>
          <label className="field">Reason for dismissal<textarea required rows={2} maxLength={4000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          <button type="submit" className="button secondary small" disabled={pending || !reason.trim()}>Save dismissal</button>
        </form>
      )}
    </div>
  );
}

export function ManualConcerns({ findings, mutate, canAdd, pending }: { findings: ManualFinding[]; mutate?: Mutate; canAdd: boolean; pending: boolean }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [reason, setReason] = useState("");

  return (
    <section className="panel evidence-panel">
      <div className="panel-heading">
        <div><h2>Manual concerns</h2><p>These stay open across revisions until resolved.</p></div>
        {mutate && canAdd && <button type="button" className="button secondary small" aria-expanded={adding} disabled={pending} onClick={() => setAdding(!adding)}><DashboardIcon name="plus" size={15} aria-hidden="true" />{adding ? "Cancel" : "Add concern"}</button>}
      </div>
      {mutate && canAdd && adding && (
        <form className="inline-form manual-form" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if (title.trim() && reason.trim() && await mutate("/manual-findings", { title, quote, reason })) {
            setAdding(false);
            setTitle("");
            setQuote("");
            setReason("");
          }
        }}>
          <label className="field">Concern title<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="field"><span>Quoted copy <small>Optional</small></span><textarea rows={2} maxLength={20000} value={quote} onChange={(event) => setQuote(event.target.value)} /></label>
          <label className="field">Explain the concern<textarea required rows={2} maxLength={4000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
          <button type="submit" className="button primary small" disabled={pending || !title.trim() || !reason.trim()}>Save concern</button>
        </form>
      )}
      {findings.length ? <div className="check-list">{findings.map((finding) => <ManualConcern key={finding.id} finding={finding} mutate={mutate} pending={pending} />)}</div> : <p className="muted panel-caption">No manual concerns.</p>}
    </section>
  );
}

function ManualConcern({ finding, mutate, pending }: { finding: ManualFinding; mutate?: Mutate; pending: boolean }) {
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState("");
  return (
    <article className={`check-card ${finding.status === "open" ? "evidence-finding" : "evidence-passed"}`}>
      <div className="check-card-heading"><h3>{finding.title}</h3><span className={`check-badge ${finding.status === "open" ? "check-finding" : "check-passed"}`}>{finding.status === "open" ? "Open" : "Resolved"}</span></div>
      <p>{finding.reason}</p>
      {finding.quote && <blockquote className="evidence-quote">“{finding.quote}”</blockquote>}
      {finding.resolution && <p className="disposition"><strong>Resolution</strong><span>{finding.resolution}</span></p>}
      {mutate && finding.status === "open" && (
        <>
          <button className="button secondary small" type="button" disabled={pending} aria-expanded={resolving} onClick={() => setResolving(!resolving)}>{resolving ? "Cancel resolution" : "Resolve concern"}</button>
          {resolving && <form className="inline-form" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (resolution.trim() && await mutate(`/manual-findings/${encodeURIComponent(finding.id)}/resolve`, { resolution })) {
              setResolving(false);
              setResolution("");
            }
          }}>
            <label className="field">Resolution rationale<textarea rows={2} required maxLength={4000} value={resolution} onChange={(event) => setResolution(event.target.value)} /></label>
            <button className="button primary small" type="submit" disabled={pending || !resolution.trim()}>Save resolution</button>
          </form>}
        </>
      )}
    </article>
  );
}

export function ReviewDecision({ detail, revision, unresolved, openManual, canRequest, mutate, onApprove, pending }: {
  detail: CaseDetail;
  revision: number;
  unresolved: number;
  openManual: number;
  canRequest: boolean;
  mutate: Mutate;
  onApprove: () => void;
  pending: boolean;
}) {
  const [requesting, setRequesting] = useState(false);
  const [note, setNote] = useState("");
  const blockers = unresolved + openManual;
  const feedback = buildChangeRequestFeedback({ note, checks: detail.revisions.find(item => item.number === revision)!.analysis.checks, dispositions: detail.dispositions, manualFindings: detail.manualFindings });
  return (
    <section id="decision" className="panel decision-panel">
      <div className="panel-heading">
        <div><h2>Review decision</h2><p>Record a copy decision for revision {revision}.</p></div>
      </div>
      <p className="muted panel-caption">{blockers ? `Approval is blocked by ${blockers} ${blockers === 1 ? "concern" : "concerns"}. For a valid concern, request changes. For missing context, request the specific information. Dismiss a finding only when it is incorrect, with a reason; resolve manual concerns only when addressed.` : "The decision applies to this copy. Visual review is separate."}</p>
      <div className="action-row">
        <button type="button" className="button secondary" disabled={pending} aria-expanded={requesting} onClick={() => setRequesting(!requesting)}><DashboardIcon name="message-plus" size={17} aria-hidden="true" />{requesting ? "Cancel request" : "Request changes"}</button>
        <button type="button" className="button primary" disabled={pending || blockers > 0} onClick={onApprove}><DashboardIcon name="check" size={17} aria-hidden="true" />Approve copy</button>
      </div>
      {requesting && (
        <form className="inline-form" onSubmit={async (event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          if ((canRequest || note.trim()) && await mutate("/decision", { decision: "request_changes", note })) {
            setRequesting(false);
            setNote("");
          }
        }}>
          <label className="field"><span>Feedback for the submitter {canRequest && <small>Optional</small>}</span><textarea rows={3} required={!canRequest} maxLength={4000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe what needs to change." /></label>
          <p className="muted">{canRequest ? "Confirmed and open manual concerns are included in the request." : "Add feedback so the submitter knows what to change."}</p>
          {(feedback.note || feedback.items.length > 0) && <section className={styles.preview} aria-label="Change request preview"><h3>Request preview · revision {revision}</h3><ChangeRequestContent feedback={feedback} /></section>}
          <button type="submit" className="button primary" disabled={pending || (!canRequest && !note.trim())}>Send change request</button>
        </form>
      )}
    </section>
  );
}
