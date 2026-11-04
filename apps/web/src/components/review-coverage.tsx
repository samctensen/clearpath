"use client";

import { useState } from "react";
import type { Analysis, CheckResult } from "@clearpath/contracts";
import styles from "./case-review.module.css";

const coverageStates = [
  { status: "finding", label: "findings", singular: "finding", outcome: "Finding", className: styles.coverageFinding },
  { status: "unknown", label: "unable to evaluate", singular: "unable to evaluate", outcome: "Unable to evaluate", className: styles.coverageUnknown },
  { status: "passed", label: "passed", singular: "passed", outcome: "Passed", className: styles.coveragePassed },
  { status: "not_applicable", label: "not applicable", singular: "not applicable", outcome: "Not applicable", className: styles.coverageNotApplicable },
] as const;

function outcomeOf(check: CheckResult) {
  return coverageStates.find((state) => state.status === check.status)!;
}

/**
 * One segment per recorded check, so the whole automated pass reads at a glance while
 * every name and outcome stays linked to its evidence.
 */
export function ReviewCoverage({ analysis, onShowCheck }: { analysis: Analysis; onShowCheck: (ruleId: string) => void }) {
  const [active, setActive] = useState<number | null>(null);
  const checks = analysis.checks;
  const inspected = active === null ? null : checks[active] ?? null;
  return (
    <section className={styles.coverage} aria-label="Automated check coverage">
      <div className={styles.coverageTitle}>
        <strong>Check coverage</strong>
        <span>{checks.length} recorded {checks.length === 1 ? "check" : "checks"}</span>
      </div>
      {checks.length === 0 ? <p className={styles.coverageEmpty}>No automated checks ran on this revision.</p> : (
        <div className={styles.meter} onMouseLeave={() => setActive(null)}>
          {checks.map((check, index) => {
            const outcome = outcomeOf(check);
            return (
              <button
                key={check.ruleId}
                type="button"
                className={`${styles.meterSegment} ${outcome.className}${active === index ? ` ${styles.meterSegmentActive}` : ""}`}
                aria-controls={`review-check-${encodeURIComponent(check.ruleId)}`}
                aria-label={`Show evidence for ${check.title}: ${outcome.outcome}`}
                onClick={() => onShowCheck(check.ruleId)}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
              ><span aria-hidden="true" /></button>
            );
          })}
          {inspected && (
            <div
              className={styles.meterTip}
              aria-hidden="true"
              style={{ left: `clamp(var(--tip-half), ${((active! + 0.5) / checks.length) * 100}%, calc(100% - var(--tip-half)))` }}
            >
              <span className={styles.meterTipName}>{inspected.title}</span>
              <span className={`${styles.coverageOutcome} ${outcomeOf(inspected).className}`}><span aria-hidden="true" />{outcomeOf(inspected).outcome}</span>
            </div>
          )}
        </div>
      )}
      <ul className={styles.coverageLegend}>
        {coverageStates.map(({ status, label, singular, className }) => {
          const count = checks.filter((check) => check.status === status).length;
          return <li key={status} data-zero={count === 0}><span className={className} aria-hidden="true" /><strong>{count}</strong> {count === 1 ? singular : label}</li>;
        })}
      </ul>
    </section>
  );
}
