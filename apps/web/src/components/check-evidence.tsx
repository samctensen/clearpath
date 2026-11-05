import type { Analysis, CheckResult } from "@clearpath/contracts";
import type { ReactNode } from "react";
import Link from "next/link";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import { CheckBadge } from "./ui";
import { cn } from "./ui/cn";
import {
  checkCard,
  checkCardHeading,
  checkChange,
  coverageSummary,
  evidenceJump,
  evidenceQuote,
  severityLabel,
  sourceLine,
  suggestion,
} from "./ui/check";

const sourceLabels = {
  regulatory_reference: "Regulatory reference",
  company_policy: "ClearPath policy",
  product_fact: "Product fact",
};

export { CheckBadge };

export function AnalysisSummary({ analysis }: { analysis: Analysis }) {
  const counts = {
    passed: analysis.checks.filter((check) => check.status === "passed").length,
    finding: analysis.checks.filter((check) => check.status === "finding").length,
    unknown: analysis.checks.filter((check) => check.status === "unknown").length,
    not_applicable: analysis.checks.filter((check) => check.status === "not_applicable").length,
  };

  return (
    <ul className={coverageSummary} aria-label="Check coverage">
      <li className="text-approved"><span />{counts.passed} passed</li>
      <li className="text-info"><span />{counts.finding} {counts.finding === 1 ? "finding" : "findings"}</li>
      <li className="text-waiting"><span />{counts.unknown} unable to evaluate</li>
      <li><span />{counts.not_applicable} not applicable</li>
    </ul>
  );
}

export function CheckEvidence({ check, children, onShowExcerpt, change }: {
  check: CheckResult;
  children?: ReactNode;
  onShowExcerpt?: () => void;
  change?: string;
}) {
  return (
    <article className={checkCard}>
      <div className={checkCardHeading}><h3>{check.title}</h3><CheckBadge status={check.status} /></div>
      {check.status === "finding" && check.severity !== "info" && (
        <span className={severityLabel}>{check.severity === "high" ? "High severity" : "Medium severity"}</span>
      )}
      {change && <p className={checkChange}>{change}</p>}
      <p>{check.explanation}</p>
      {check.excerpt && (
        onShowExcerpt
          ? <button className={cn(evidenceQuote, evidenceJump)} type="button" onClick={onShowExcerpt} title="Show this excerpt in the copy">“{check.excerpt.text}”</button>
          : <blockquote className={evidenceQuote}>“{check.excerpt.text}”</blockquote>
      )}
      {check.suggestion && <p className={suggestion}><strong>Suggested next step</strong>{check.suggestion}</p>}
      <div className={sourceLine}>
        <span>{sourceLabels[check.reference.type]}</span>
        {check.reference.url ? (
          <a href={check.reference.url} target="_blank" rel="noreferrer">{check.reference.label}<DashboardIcon name="arrow-up-right" size={13} aria-hidden="true" /></a>
        ) : <span>{check.reference.label}</span>}
        <Link href={`/policies#${encodeURIComponent(check.ruleId)}`}>Check guidance<DashboardIcon name="arrow-right" size={11} /></Link>
      </div>
      {children}
    </article>
  );
}
