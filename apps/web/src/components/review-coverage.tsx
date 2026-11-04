import type { Analysis } from "@clearpath/contracts";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import styles from "./case-review.module.css";

const coverageStates = [
  { status: "finding", label: "findings", singular: "finding", outcome: "Finding", className: styles.coverageFinding },
  { status: "unknown", label: "unable to evaluate", singular: "unable to evaluate", outcome: "Unable to evaluate", className: styles.coverageUnknown },
  { status: "passed", label: "passed", singular: "passed", outcome: "Passed", className: styles.coveragePassed },
  { status: "not_applicable", label: "not applicable", singular: "not applicable", outcome: "Not applicable", className: styles.coverageNotApplicable },
] as const;

/** Names and outcomes remain linked to the evidence, including checks that could not run. */
export function ReviewCoverage({ analysis, onShowCheck }: { analysis: Analysis; onShowCheck: (ruleId: string) => void }) {
  return (
    <section className={styles.coverage} aria-label="Automated check coverage">
      <div className={styles.coverageHeading}>
        <div className={styles.coverageTitle}>
          <strong>Check coverage</strong>
          <span>{analysis.checks.length} recorded {analysis.checks.length === 1 ? "check" : "checks"}</span>
        </div>
        <ul className={styles.coverageLegend}>
          {coverageStates.map(({ status, label, singular, className }) => {
            const count = analysis.checks.filter((check) => check.status === status).length;
            return <li key={status}><span className={className} aria-hidden="true" /><strong>{count}</strong> {count === 1 ? singular : label}</li>;
          })}
        </ul>
      </div>
      <ul className={styles.coverageChecks}>
        {analysis.checks.map((check) => {
          const outcome = coverageStates.find((state) => state.status === check.status)!;
          return <li key={check.ruleId}>
            <button type="button" onClick={() => onShowCheck(check.ruleId)} aria-controls={`review-check-${encodeURIComponent(check.ruleId)}`} aria-label={`Show evidence for ${check.title}: ${outcome.outcome}`}>
              <span className={styles.coverageCheckName}>{check.title}</span>
              <span className={`${styles.coverageOutcome} ${outcome.className}`}><span aria-hidden="true" />{outcome.outcome}</span>
              <DashboardIcon name="chevron-right" size={11} className={styles.coverageArrow} />
            </button>
          </li>;
        })}
      </ul>
    </section>
  );
}
