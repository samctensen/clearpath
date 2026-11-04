"use client";

import Link from "next/link";
import type { CaseDetail, DashboardRow } from "@clearpath/contracts";
import { useResource } from "@/lib/use-resource";
import { buildSubmissionJourney } from "@/lib/submission-journey";
import { formatDate, formatTime } from "../ui";
import { SubmissionJourney } from "./submission-journey";
import styles from "./submissions.module.css";

const stateLabels = { needs_information: "Needs information", changes_requested: "Changes requested", ready_for_review: "Awaiting review", approved: "Copy approved" } as const;
const sourceLabels = { reviewer_feedback: "Reviewer", missing_information: "Automated check", awaiting_review: "Submission", approved_copy: "Reviewer decision" } as const;

export function SubmitterDashboard({ attention, attentionTotal, selectedId, refreshGeneration, loading, error, onSelect, onViewAttention, onRetry }: {
  attention: DashboardRow[]; attentionTotal: number; selectedId: string | null; refreshGeneration: number; loading: boolean; error: string | null;
  onSelect(id: string): void; onViewAttention(): void; onRetry(): void;
}) {
  return <div className={styles.panels}>
    <section className={styles.panel} aria-labelledby="attention-heading">
      <div className={styles.panelHeading}><div><h2 id="attention-heading">Needs attention {!loading && !error && <span className={styles.count}>{attentionTotal}</span>}</h2></div><button className={styles.textButton} type="button" onClick={onViewAttention}>View all</button></div>
      {loading ? <div className={styles.skeleton} role="status"><span>Loading submissions…</span><i /><i /><i /></div> : error ? <div className={styles.empty}><p>Couldn’t load submissions.</p><button className={styles.textButton} onClick={onRetry} type="button">Try again</button></div> : attention.length ? <ul className={styles.attentionList}>{attention.map(item => <li className={styles.attentionItem} key={item.id}>
        <div className={styles.itemTitle}><strong>{item.title}</strong><span className={styles.badge} data-status={item.status}>{stateLabels[item.status]}</span></div>
        <p className={styles.meta}>Revision {item.revision} · Target {formatDate(item.launchDate)}</p>
        <p className={styles.snippet}><b>{item.guidance ? sourceLabels[item.guidance.kind] : "Details"}</b> {item.guidance?.text || "Open submission for details."}</p>
        <div className={styles.itemActions}><button type="button" className={styles.textButton} aria-label={`Preview journey for ${item.title}`} aria-pressed={selectedId === item.id} onClick={() => onSelect(item.id)}>Preview journey</button><Link className={styles.actionLink} href={`/cases/${encodeURIComponent(item.id)}?intent=revise`}>{item.status === "needs_information" ? "Add information" : "Revise copy"} <span aria-hidden="true">→</span></Link></div>
      </li>)}</ul> : <div className={styles.empty}><p>No submissions need changes or information.</p><span>Current submissions can be previewed from the list below.</span></div>}
    </section>
    <section className={styles.panel} id="submission-journey" tabIndex={-1} aria-label="Selected submission journey">
      {selectedId ? <SelectedJourney key={`${selectedId}:${refreshGeneration}`} selectedId={selectedId} onRetryList={onRetry} /> : loading ? <div className={styles.skeleton} role="status"><span>Loading journey…</span><i /><i /><i /></div> : <div className={styles.empty}><p className={styles.eyebrow}>Submission journey</p><h2>Choose a submission</h2><p>Preview a submission to see its current state and recorded history.</p><Link className={styles.actionLink} href="/new">New submission →</Link></div>}
    </section>
  </div>;
}

function SelectedJourney({ selectedId, onRetryList }: { selectedId: string; onRetryList(): void }) {
  const resource = useResource<CaseDetail>(`/cases/${encodeURIComponent(selectedId)}`);
  if (resource.loading) return <div className={styles.skeleton} role="status"><span>Loading journey…</span><i /><i /><i /></div>;
  if (resource.error || !resource.data || resource.data.case.id !== selectedId) return <div className={styles.empty} role="alert"><h2>Couldn’t load this journey</h2><p>{resource.error || "This submission is no longer available."}</p><div className={styles.itemActions}><button type="button" className={styles.textButton} onClick={resource.reload}>Try again</button><button type="button" className={styles.textButton} onClick={onRetryList}>Refresh list</button></div></div>;
  const detail = resource.data;
  const { currentRevision, openManualConcerns, events } = buildSubmissionJourney(detail);
  const currentEvent = [...events].reverse().find(event => event.revision === currentRevision && (event.type === "changes_requested" || event.type === "approved"));
  const current = detail.revisions.find(revision => revision.number === currentRevision);
  const missing = current?.analysis.checks.filter(check => check.status === "unknown") ?? [];
  const status = detail.case.status;
  const href = `/cases/${encodeURIComponent(selectedId)}`;
  return <>
    <div className={styles.panelHeading}><div className={styles.titleBlock}><h2>{detail.case.title}</h2><p className={styles.meta}>Revision {currentRevision} · {detail.case.publisher}</p></div><span className={styles.badge} data-status={status}>{stateLabels[status]}</span></div>
    <div className={styles.current}>
      {status === "changes_requested" && <><p className={styles.source}>Reviewer feedback · Revision {currentRevision}</p><p className={styles.currentPreview}>{currentEvent?.type === "changes_requested" ? currentEvent.message : "Open submission for details."}</p></>}
      {status === "needs_information" && <><p className={styles.source}>Automated check · Revision {currentRevision}</p><p className={styles.currentPreview}>{missing[0]?.explanation || "Open submission for details."}</p></>}
      {status === "ready_for_review" && <><p className={styles.source}>Awaiting human review</p><p>Revision {currentRevision} submitted{current ? ` ${formatTime(current.createdAt)}` : ""}.</p></>}
      {status === "approved" && <><p className={styles.source}>Reviewer decision · Revision {currentRevision}</p><p className={styles.currentPreview}>{currentEvent?.type === "approved" ? currentEvent.message : `Copy approved for revision ${currentRevision}.`}</p></>}
      {(status === "changes_requested" || status === "needs_information" || status === "approved") && <Link className={styles.feedbackLink} href={href}>Open submission for full feedback</Link>}
      {openManualConcerns.length > 0 && <div className={styles.concerns}><p className={styles.source}>Open reviewer concerns</p><ul>{openManualConcerns.slice(0, 2).map(concern => <li key={concern.id}>{concern.title}</li>)}</ul>{openManualConcerns.length > 2 && <Link className={styles.feedbackLink} href={href}>View {openManualConcerns.length - 2} more concerns</Link>}<p>Reviewer confirmation is still required.</p></div>}
      <Link className={styles.primaryAction} href={status === "changes_requested" || status === "needs_information" ? `${href}?intent=revise` : status === "approved" ? `${href}?revision=${currentRevision}` : href}>{status === "changes_requested" ? "Revise copy" : status === "needs_information" ? "Add information" : status === "approved" ? `View approved revision ${currentRevision}` : "View submission"} <span aria-hidden="true">→</span></Link>
    </div>
    <SubmissionJourney detail={detail} />
  </>;
}
