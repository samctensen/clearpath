import type { Activity, CaseDetail, ChangeRequestFeedback, Revision } from "@clearpath/contracts";
import { CheckBadge } from "../check-evidence";
import styles from "./submission-feedback.module.css";

/** The same readable correction items are used in the send preview and saved feedback. */
export function ChangeRequestContent({ feedback }: { feedback: ChangeRequestFeedback }) {
  return <div className={styles.requestContent}>
    {feedback.note && <p><strong>Reviewer note</strong><br />{feedback.note}</p>}
    {feedback.items.length > 0 && <ul className={styles.requestItems}>{feedback.items.map((item) => <li key={`${item.source}:${item.sourceId}`}>
      <strong>{item.title}</strong>
      {item.quote && <blockquote>{item.quote}</blockquote>}
      {item.explanation && <p>{item.explanation}</p>}
      <p><strong>Next step:</strong> {item.nextStep}</p>
      {item.reviewerNote && <p><strong>Reviewer note:</strong> {item.reviewerNote}</p>}
    </li>)}</ul>}
  </div>;
}

function RecordedFeedback({ event }: { event: Activity }) {
  return event.changeRequest ? <ChangeRequestContent feedback={event.changeRequest} /> : <p>{event.message}</p>;
}

/** Human decisions belong to the revision they reviewed; manual concerns belong to the case. */
export function SubmissionFeedback({ detail, revisionNumber, editing = false }: { detail: CaseDetail; revisionNumber: number; editing?: boolean }) {
  const current = detail.revisions.at(-1)!;
  const decision = detail.events.findLast((event) => event.revision === revisionNumber && (event.type === "changes_requested" || event.type === "approved"));
  const earlier = revisionNumber === current.number && !decision
    ? detail.events.findLast((event) => event.revision < revisionNumber && event.type === "changes_requested")
    : undefined;
  const concerns = detail.manualFindings.filter((finding) => finding.status === "open");
  const shownManualIds = new Set([decision, earlier].flatMap((event) =>
    event?.changeRequest?.items.filter((item) => item.source === "manual").map((item) => item.sourceId) ?? []));
  const additionalConcerns = concerns.filter((finding) => !shownManualIds.has(finding.id));
  const includedManualCount = concerns.length - additionalConcerns.length;
  const awaiting = revisionNumber === current.number && detail.case.status === "ready_for_review";
  const emptyMessage = awaiting ? `Revision ${revisionNumber} submitted; awaiting human review.` : `No reviewer decision recorded for revision ${revisionNumber}.`;
  if (!decision && !earlier && !concerns.length) {
    return <p className={styles.emptyFeedback}>{emptyMessage}</p>;
  }
  return (
    <section className={styles.feedback} aria-labelledby="submission-feedback-title">
      <h2 id="submission-feedback-title">{editing ? `Feedback on saved revision ${revisionNumber}` : "Reviewer feedback"}</h2>
      {editing && <p>These requests refer to the saved copy. Checks on your unsaved draft appear separately below.</p>}
      {decision ? <div className={styles.entry}>
        <h3>{decision.type === "approved" ? `Copy approved for revision ${decision.revision}` : `Feedback on revision ${decision.revision}`}</h3>
        <RecordedFeedback event={decision} />
        {decision.type === "approved" && <p>Approval applies to this copy revision. Visual and legal review are separate.</p>}
      </div> : <p>{emptyMessage}</p>}
      {earlier && <div className={styles.entry}><h3>Earlier feedback on revision {earlier.revision}</h3><RecordedFeedback event={earlier} /></div>}
      <div className={styles.concerns}>
        <h3>Current open manual concerns</h3>
        {concerns.length ? <>
          <p>{includedManualCount > 0 ? `${includedManualCount} manual ${includedManualCount === 1 ? "concern included above remains" : "concerns included above remain"} open. ` : ""}A reviewer must confirm resolution of open manual concerns.</p>
          {additionalConcerns.length > 0 && <ul>{additionalConcerns.map((finding) => <li key={finding.id}><strong>{finding.title}</strong>{finding.quote && <blockquote>{finding.quote}</blockquote>}<p>{finding.reason}</p></li>)}</ul>}
        </> : <p>No open manual concerns.</p>}
      </div>
    </section>
  );
}

/** These checks describe the saved revision, not a reviewer decision. */
export function AutomatedMissingInformation({ revision }: { revision: Revision }) {
  const unknowns = revision.analysis.checks.filter((check) => check.status === "unknown");
  if (!unknowns.length) return null;
  return (
    <section className={styles.feedback} aria-labelledby="automated-missing-information-title">
      <h2 id="automated-missing-information-title">Automated missing information · Revision {revision.number}</h2>
      <p>These automated checks need more context. Human review is still required.</p>
      <ul className={styles.missingList}>{unknowns.map((check) => <li key={check.ruleId}>
        <div className={styles.checkHeading}><strong>{check.title}</strong><CheckBadge status="unknown" /></div>
        <p>{check.explanation}</p>
        {check.suggestion && <p>{check.suggestion}</p>}
      </li>)}</ul>
    </section>
  );
}
