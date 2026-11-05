"use client";

import { DashboardIcon } from "./dashboard/dashboard-icon";
import { useId, useState, type FormEvent } from "react";
import { buildChangeRequestFeedback, type CaseDetail, type Disposition, type ManualFinding } from "@clearpath/contracts";
import { ChangeRequestContent } from "./submissions/submission-feedback";
import { Button, CheckBadge, actionRow, cn, panel, panelCaption, panelHeading } from "./ui";
import { checkCard, checkCardHeading, checkList, disposition as dispositionClass, evidenceQuote, findingActions } from "./ui/check";
import { expandable, expandableInner, field, inlineForm } from "./ui/form";

type Mutate = (path: string, body: object) => Promise<boolean>;

export function FindingActions({ ruleId, confirmationReason, disposition, mutate, pending }: {
  ruleId: string;
  confirmationReason: string;
  disposition?: Disposition;
  mutate?: Mutate;
  pending: boolean;
}) {
  const [dismissing, setDismissing] = useState(false);
  const formId = useId();
  const [reason, setReason] = useState("");

  return (
    <div className={findingActions}>
      {disposition && (
        <p className={dispositionClass}><strong>{disposition.action === "confirmed" ? "Confirmed concern" : "Dismissed"}</strong>{disposition.reason && <span>{disposition.reason}</span>}</p>
      )}
      {mutate && (
        <div className={actionRow}>
          {disposition?.action !== "confirmed" && (
            <Button variant="secondary" size="small" disabled={pending} onClick={async () => {
              if (await mutate("/dispositions", { ruleId, action: "confirmed", reason: confirmationReason })) setDismissing(false);
            }}><DashboardIcon name="check" size={15} aria-hidden="true" />Confirm concern</Button>
          )}
          <Button variant="ghost" size="small" aria-expanded={dismissing} aria-controls={formId} disabled={pending} onClick={() => setDismissing(!dismissing)}>{dismissing ? "Cancel dismissal" : disposition?.action === "dismissed" ? "Update dismissal" : "Dismiss"}</Button>
        </div>
      )}
      {mutate && (
        <div className={expandable} data-expanded={dismissing || undefined} inert={!dismissing}>
          <div className={expandableInner}>
            <form id={formId} className={cn(inlineForm, "pb-1")} onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              if (reason.trim() && await mutate("/dispositions", { ruleId, action: "dismissed", reason })) {
                setDismissing(false);
                setReason("");
              }
            }}>
              <label className={field}>Reason for dismissal<textarea required rows={2} maxLength={4000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
              <Button type="submit" variant="secondary" size="small" disabled={pending || !reason.trim()}>Save dismissal</Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ManualConcerns({ findings, mutate, canAdd, pending }: { findings: ManualFinding[]; mutate?: Mutate; canAdd: boolean; pending: boolean }) {
  const [adding, setAdding] = useState(false);
  const formId = useId();
  const [title, setTitle] = useState("");
  const [quote, setQuote] = useState("");
  const [reason, setReason] = useState("");

  return (
    <section className={cn(panel, "p-[18px]")}>
      <div className={panelHeading}>
        <div><h2>Manual concerns</h2><p>These stay open across revisions until resolved.</p></div>
        {mutate && canAdd && (
          <Button variant={adding ? "ghost" : "secondary"} size="small" aria-expanded={adding} aria-controls={formId} disabled={pending} onClick={() => setAdding(!adding)}>
            <DashboardIcon name={adding ? "xmark" : "plus"} size={15} aria-hidden="true" />{adding ? "Cancel" : "Add concern"}
          </Button>
        )}
      </div>
      {mutate && canAdd && (
        <div className={expandable} data-expanded={adding || undefined} inert={!adding}>
          <div className={expandableInner}>
            <form id={formId} className={cn(inlineForm, "pt-3 pb-[13px]")} onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              if (title.trim() && reason.trim() && await mutate("/manual-findings", { title, quote, reason })) {
                setAdding(false);
                setTitle("");
                setQuote("");
                setReason("");
              }
            }}>
              <label className={field}>Concern title<input required maxLength={160} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
              <label className={field}><span>Quoted copy <small>Optional</small></span><textarea rows={2} maxLength={20000} value={quote} onChange={(event) => setQuote(event.target.value)} /></label>
              <label className={field}>Explain the concern<textarea required rows={2} maxLength={4000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
              <Button type="submit" variant="primary" size="small" disabled={pending || !title.trim() || !reason.trim()}>Save concern</Button>
            </form>
          </div>
        </div>
      )}
      {findings.length ? <div className={checkList}>{findings.map((finding) => <ManualConcern key={finding.id} finding={finding} mutate={mutate} pending={pending} />)}</div> : <p className={cn("text-muted", panelCaption)}>No manual concerns.</p>}
    </section>
  );
}

function ManualConcern({ finding, mutate, pending }: { finding: ManualFinding; mutate?: Mutate; pending: boolean }) {
  const [resolving, setResolving] = useState(false);
  const formId = useId();
  const [resolution, setResolution] = useState("");
  return (
    <article className={checkCard}>
      <div className={checkCardHeading}><h3>{finding.title}</h3><CheckBadge status={finding.status === "open" ? "finding" : "passed"} label={finding.status === "open" ? "Open" : "Resolved"} /></div>
      <p>{finding.reason}</p>
      {finding.quote && <blockquote className={evidenceQuote}>“{finding.quote}”</blockquote>}
      {finding.resolution && <p className={dispositionClass}><strong>Resolution</strong><span>{finding.resolution}</span></p>}
      {mutate && finding.status === "open" && (
        <>
          <Button variant="secondary" size="small" className="mt-3" disabled={pending} aria-expanded={resolving} aria-controls={formId} onClick={() => setResolving(!resolving)}>{resolving ? "Cancel resolution" : "Resolve concern"}</Button>
          <div className={expandable} data-expanded={resolving || undefined} inert={!resolving}>
            <div className={expandableInner}>
              <form id={formId} className={cn(inlineForm, "pb-1")} onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                if (resolution.trim() && await mutate(`/manual-findings/${encodeURIComponent(finding.id)}/resolve`, { resolution })) {
                  setResolving(false);
                  setResolution("");
                }
              }}>
                <label className={field}>Resolution rationale<textarea rows={2} required maxLength={4000} value={resolution} onChange={(event) => setResolution(event.target.value)} /></label>
                <Button variant="primary" size="small" type="submit" disabled={pending || !resolution.trim()}>Save resolution</Button>
              </form>
            </div>
          </div>
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
  const formId = useId();
  const [note, setNote] = useState("");
  const blockers = unresolved + openManual;
  const feedback = buildChangeRequestFeedback({ note, checks: detail.revisions.find(item => item.number === revision)!.analysis.checks, dispositions: detail.dispositions, manualFindings: detail.manualFindings });
  return (
    <section id="decision" className={cn(panel, "p-[18px] border-[#473163] bg-[#141019]")}>
      <div className={panelHeading}>
        <div><h2>Review decision</h2><p>Record a copy decision for revision {revision}.</p></div>
      </div>
      <p className={cn("text-muted", panelCaption)}>{blockers ? `Approval is blocked by ${blockers} ${blockers === 1 ? "concern" : "concerns"}. For a valid concern, request changes. For missing context, request the specific information. Dismiss a finding only when it is incorrect, with a reason; resolve manual concerns only when addressed.` : "The decision applies to this copy. Visual review is separate."}</p>
      <div className={cn(actionRow, "mt-[14px]")}>
        <Button variant={requesting ? "ghost" : "secondary"} disabled={pending} aria-expanded={requesting} aria-controls={formId} onClick={() => setRequesting(!requesting)}><DashboardIcon name={requesting ? "xmark" : "message-plus"} size={17} aria-hidden="true" />{requesting ? "Cancel request" : "Request changes"}</Button>
        <Button variant="primary" disabled={pending || blockers > 0} onClick={onApprove}><DashboardIcon name="check" size={17} aria-hidden="true" />Approve copy</Button>
      </div>
      <div className={expandable} data-expanded={requesting || undefined} inert={!requesting}>
        <div className={expandableInner}>
          <form id={formId} className={cn(inlineForm, "pb-1")} onSubmit={async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if ((canRequest || note.trim()) && await mutate("/decision", { decision: "request_changes", note })) {
              setRequesting(false);
              setNote("");
            }
          }}>
            <label className={field}><span>Feedback for the submitter {canRequest && <small>Optional</small>}</span><textarea rows={3} required={!canRequest} maxLength={4000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Describe what needs to change." /></label>
            <p className="text-muted">{canRequest ? "Confirmed and open manual concerns are included in the request." : "Add feedback so the submitter knows what to change."}</p>
            {(feedback.note || feedback.items.length > 0) && <section className="p-[15px] rounded-lg border border-[#3d314d] bg-[#121014] [&>h3]:mt-0 [&>h3]:mb-2.5 [&>h3]:text-[#d4c7e6] [&>h3]:text-xs [&>h3]:font-[650]" aria-label="Change request preview"><h3>Request preview · revision {revision}</h3><ChangeRequestContent feedback={feedback} /></section>}
            <Button type="submit" variant="primary" disabled={pending || (!canRequest && !note.trim())}>Send change request</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
