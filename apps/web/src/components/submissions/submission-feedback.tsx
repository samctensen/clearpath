import type { CaseDetail, Revision } from "@clearpath/contracts";
import { CheckBadge } from "../check-evidence";
import styles from "./submission-feedback.module.css";

/** Human decisions belong to the revision they reviewed; manual concerns belong to the case. */
export function SubmissionFeedback({ detail, revisionNumber }: { detail: CaseDetail; revisionNumber: number }) {
  const current = detail.revisions.at(-1)!;
  const decision = detail.events.findLast((event) => event.revision === revisionNumber && (event.type === "changes_requested" || event.type === "approved"));
  const earlier = revisionNumber === current.number && !decision
    ? detail.events.findLast((event) => event.revision < revisionNumber && event.type === "changes_requested")
    : undefined;
  const concerns = detail.manualFindings.filter((finding) => finding.status === "open");
  const awaiting = revisionNumber === current.number && detail.case.status === "ready_for_review";
  const emptyMessage = awaiting ? `Revision ${revisionNumber} submitted; awaiting human review.` : `No reviewer decision recorded for revision ${revisionNumber}.`;
  if (!decision && !earlier && !concerns.length) {
    return <p className={styles.emptyFeedback}>{emptyMessage}</p>;
  }
  return (
    <section className={styles.feedback} aria-labelledby="submission-feedback-title">
      <h2 id="submission-feedback-title">Reviewer feedback</h2>
      {decision ? <div className={styles.entry}>
        <h3>{decision.type === "approved" ? `Copy approved for revision ${decision.revision}` : `Feedback on revision ${decision.revision}`}</h3>
        {decision.message && <p>{decision.message}</p>}
        {decision.type === "approved" && <p>Approval applies to this copy revision. Visual and legal review are separate.</p>}
      </div> : <p>{emptyMessage}</p>}
      {earlier && <div className={styles.entry}><h3>Earlier feedback on revision {earlier.revision}</h3><p>{earlier.message}</p></div>}
      <div className={styles.concerns}>
        <h3>Current open manual concerns</h3>
        {concerns.length ? <><p>These concerns remain open for the current submission. A reviewer must confirm their resolution.</p><ul>{concerns.map((finding) => <li key={finding.id}><strong>{finding.title}</strong>{finding.quote && <blockquote>{finding.quote}</blockquote>}<p>{finding.reason}</p></li>)}</ul></> : <p>No open manual concerns.</p>}
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
