"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { productLabels, type CaseDetail, type DemoRole } from "@clearpath/contracts";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useApiMutation } from "@/lib/use-api-mutation";
import { DashboardIcon } from "./dashboard-icon";
import { CaseStatusBadge, buttonClass } from "../ui";
import { styles } from "./queue-action-dialog.styles";

export type QueueAction = "approve" | "request_changes" | "delete";

const labels: Record<QueueAction, { title: string; icon: string; confirm: string; description: string }> = {
  approve: { title: "Approve copy", icon: "check", confirm: "Approve this revision", description: "Review the current copy and check results before recording your decision." },
  request_changes: { title: "Request changes", icon: "message-plus", confirm: "Send change request", description: "Tell the submitter what needs to change in this revision." },
  delete: { title: "Delete submission", icon: "trash-can", confirm: "Delete submission", description: "Remove this submission from the queue. Its revisions and review history will be retained." },
};

export function QueueActionDialog({ caseId, title, action, role, currentRole, expectedRevision, onClose, onSuccess }: {
  caseId: string;
  title: string;
  action: QueueAction;
  role: DemoRole;
  currentRole: DemoRole;
  expectedRevision?: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const id = useId();
  const mutation = useApiMutation<unknown>();
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const saving = useRef(false);
  const backdropPress = useRef(false);
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<{ message: string; conflict: boolean } | null>(null);
  const path = `/cases/${encodeURIComponent(caseId)}`;
  const copy = labels[action];
  const revision = detail?.revisions.at(-1);
  const staleRevision = expectedRevision !== undefined && revision !== undefined && revision.number !== expectedRevision;
  const concerns = revision?.analysis.checks.filter(check => check.status === "finding" || check.status === "unknown") ?? [];
  const dismissed = new Set(detail?.dispositions.filter(item => item.action === "dismissed").map(item => item.ruleId));
  const unresolved = concerns.filter(check => !dismissed.has(check.ruleId)).length;
  const openManual = detail?.manualFindings.filter(item => item.status === "open").length ?? 0;
  const notApplicable = revision?.analysis.checks.filter(check => check.status === "not_applicable").length ?? 0;
  const approvalNeedsReview = action === "approve" && unresolved + openManual > 0;
  const decisionOpen = detail?.case.status === "ready_for_review" || detail?.case.status === "needs_information";
  const roleAllowed = role === currentRole && role === (action === "delete" ? "submitter" : "reviewer");
  const statusAllowed = action === "delete" ? detail?.case.status !== "approved" : decisionOpen;
  const blocked = staleRevision || !roleAllowed || !statusAllowed || (action === "approve" && unresolved + openManual > 0);
  const canSubmit = Boolean(revision) && !loading && !pending && !blocked && !error?.conflict && (action !== "request_changes" || Boolean(note.trim()));

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    heading.current?.focus({ preventScroll: true });
    return () => element?.close();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setDetail(null);
    setError(null);
    api<CaseDetail>(path, { signal: controller.signal })
      .then(value => { if (!controller.signal.aborted) setDetail(value); })
      .catch(failure => { if (!controller.signal.aborted) setError({ message: errorMessage(failure), conflict: false }); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, attempt]);

  function close() {
    if (saving.current) return;
    dialog.current?.close();
    onClose();
  }

  async function submit() {
    if (!canSubmit || !revision || saving.current) return;
    saving.current = true;
    setPending(true);
    setError(null);
    try {
      await mutation.mutateAsync({
        path: action === "delete" ? `${path}/delete` : `${path}/decision`,
        options: {
          role,
          body: action === "delete"
            ? { expectedRevision: revision.number }
            : { expectedRevision: revision.number, decision: action, note: action === "request_changes" ? note.trim() : "" },
        },
      });
      dialog.current?.close();
      onSuccess(action === "delete" ? `${detail!.case.title} removed from the queue. Review history retained.` : action === "approve" ? `Copy approved for ${detail!.case.title}, revision ${revision.number}.` : `Changes requested for ${detail!.case.title}, revision ${revision.number}.`);
    } catch (failure) {
      setError({ message: errorMessage(failure), conflict: failure instanceof ApiError && failure.status === 409 });
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); close(); }}
    onPointerDown={event => { backdropPress.current = event.target === event.currentTarget; }}
    onClick={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (backdropPress.current && event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) close();
      backdropPress.current = false;
    }}>
    <header className={styles.header}>
      <span className={styles.actionIcon} data-danger={action === "delete"}><DashboardIcon name={copy.icon} size={19} /></span>
      <div><h2 id={`${id}-title`} ref={heading} tabIndex={-1}>{copy.title}</h2><p id={`${id}-description`}>{copy.description}</p></div>
      <button type="button" className={styles.close} aria-label="Close dialog" disabled={pending} onClick={close}><DashboardIcon name="xmark" size={16} /></button>
    </header>
    <form onSubmit={event => { event.preventDefault(); void submit(); }}>
      <div className={styles.content} aria-busy={loading || pending}>
        {loading ? <div className={styles.loading} role="status"><span /><span /><span /><p>Loading current revision…</p></div> : revision && detail ? <>
          <div className={styles.campaign}><h3>{detail.case.title}</h3><p>{revision.input.publisher} · {productLabels[revision.input.productId]}</p><div><span className={styles.revisionTag}>Revision {revision.number}</span><CaseStatusBadge status={detail.case.status} /></div></div>
          {action !== "delete" && <>
            <section aria-labelledby={`${id}-copy`}><div className={styles.sectionHeading}><h3 id={`${id}-copy`}>Marketing copy</h3><Link href={path} aria-disabled={pending || undefined} tabIndex={pending ? -1 : undefined} onClick={event => { if (saving.current) event.preventDefault(); }}>Open full review<DashboardIcon name="arrow-up-right" size={12} /></Link></div><div className={styles.marketingCopy} tabIndex={0} role="region" aria-label={`Marketing copy, revision ${revision.number}`}>{revision.input.content}</div></section>
            <section className={styles.checkSummary} aria-labelledby={`${id}-checks`}><h3 id={`${id}-checks`}>Check summary</h3><dl><div><dt>Passed</dt><dd>{revision.analysis.checks.filter(check => check.status === "passed").length}</dd></div><div><dt>Dismissed</dt><dd>{concerns.length - unresolved}</dd></div><div data-concern={unresolved > 0}><dt>Findings / unknowns</dt><dd>{unresolved}</dd></div><div data-concern={openManual > 0}><dt>Manual concerns</dt><dd>{openManual}</dd></div></dl>{notApplicable > 0 && <p className={styles.checkScope}>{notApplicable} {notApplicable === 1 ? "check is" : "checks are"} not applicable to this copy.</p>}</section>
          </>}
          {action === "approve" && <p className={styles.scope}>Approval applies only to revision {revision.number}. It does not clear the asset for publication.</p>}
          {staleRevision && <p className={styles.error} role="alert">A newer revision exists. Close this dialog and load the latest submission before making a decision.</p>}
          {approvalNeedsReview && <div className={styles.warning}><DashboardIcon name="circle-exclamation" size={17} /><div><strong>Resolve {unresolved + openManual} {unresolved + openManual === 1 ? "concern" : "concerns"} before approving</strong><p>For a valid concern, request changes. For missing context, request the specific information. Dismiss a finding only when it is incorrect, with a reason; resolve manual concerns only when addressed.</p></div></div>}
          {action === "request_changes" && <label className={styles.feedback}><span>What needs to change?</span><textarea required rows={4} maxLength={4000} value={note} disabled={pending} onChange={event => setNote(event.target.value)} placeholder="Describe the copy or information to update, and why." /><small>Give the submitter clear next steps. Confirmed findings and open manual concerns are included.</small></label>}
          {action === "delete" && <div className={styles.warning}><DashboardIcon name="circle-info" size={17} /><p>This submission will no longer appear in the review queue. Its history remains stored, but it cannot be restored from this workspace.</p></div>}
          {!roleAllowed && <p className={styles.error} role="alert">Your demo role changed. Close this dialog and reopen the action for your current role.</p>}
          {!statusAllowed && <p className={styles.error} role="alert">{action === "delete" ? "Approved copy cannot be deleted. Revise the submission first." : "This revision already has a decision. Open the review to see its latest status."}</p>}
        </> : <p className={styles.scope}>{title}</p>}
        {error && <div className={styles.error} role="alert"><p>{error.message}</p>{(!detail || error.conflict) && <button type="button" className={buttonClass({ variant: "secondary", size: "small" })} disabled={pending} onClick={() => setAttempt(value => value + 1)}>{error.conflict ? "Reload current revision" : "Try again"}</button>}</div>}
        <p className="sr-only" role="status">{pending ? "Saving action. Please wait." : ""}</p>
      </div>
      <footer className={styles.footer}>
        <button type="button" className={buttonClass({ variant: "secondary" })} disabled={pending} onClick={close}>Cancel</button>
        {approvalNeedsReview ? <Link href={`${path}#decision`} className={buttonClass({ variant: "primary" })} aria-disabled={pending || undefined} tabIndex={pending ? -1 : undefined} onClick={event => { if (saving.current) event.preventDefault(); }}>Continue review<DashboardIcon name="arrow-right" size={14} /></Link> : <button type="submit" className={buttonClass({ variant: action === "delete" ? "danger" : "primary" })} disabled={!canSubmit}>{pending ? "Saving…" : copy.confirm}</button>}
      </footer>
    </form>
  </dialog>;
}
