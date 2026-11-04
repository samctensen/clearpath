import type { Analysis, CheckResult } from "@clearpath/contracts";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import type { ReactNode } from "react";
import Link from "next/link";

const checkLabels = {
  passed: "Passed",
  finding: "Finding",
  unknown: "Unable to evaluate",
  not_applicable: "Not applicable",
};

const sourceLabels = {
  regulatory_reference: "Regulatory reference",
  company_policy: "ClearPath policy",
  product_fact: "Product fact",
};

export function CheckBadge({ status }: { status: CheckResult["status"] }) {
  const icon = { passed: "check", finding: "triangle-exclamation", unknown: "circle-question", not_applicable: "minus" }[status];
  return <span className={`check-badge check-${status}`}><DashboardIcon name={icon} size={13} aria-hidden="true" />{checkLabels[status]}</span>;
}

export function AnalysisSummary({ analysis }: { analysis: Analysis }) {
  const counts = {
    passed: analysis.checks.filter((check) => check.status === "passed").length,
    finding: analysis.checks.filter((check) => check.status === "finding").length,
    unknown: analysis.checks.filter((check) => check.status === "unknown").length,
    not_applicable: analysis.checks.filter((check) => check.status === "not_applicable").length,
  };

  return (
    <ul className="coverage-summary" aria-label="Check coverage">
      <li className="coverage-passed"><span />{counts.passed} passed</li>
      <li className="coverage-finding"><span />{counts.finding} {counts.finding === 1 ? "finding" : "findings"}</li>
      <li className="coverage-unknown"><span />{counts.unknown} unable to evaluate</li>
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
    <article className={`check-card evidence-${check.status}`}>
      <div className="check-card-heading"><h3>{check.title}</h3><CheckBadge status={check.status} /></div>
      {check.status === "finding" && check.severity !== "info" && <span className="severity-label">{check.severity === "high" ? "High severity" : "Medium severity"}</span>}
      {change && <p className="check-change">{change}</p>}
      <p>{check.explanation}</p>
      {check.excerpt && (
        onShowExcerpt
          ? <button className="evidence-quote evidence-jump" type="button" onClick={onShowExcerpt} title="Show this excerpt in the copy">“{check.excerpt.text}”</button>
          : <blockquote className="evidence-quote">“{check.excerpt.text}”</blockquote>
      )}
      {check.suggestion && <p className="suggestion"><strong>Suggested next step</strong>{check.suggestion}</p>}
      <div className="source-line">
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
