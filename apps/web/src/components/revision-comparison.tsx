"use client";

import { useMemo } from "react";
import type { CheckResult, Revision } from "@clearpath/contracts";
import { buildTextDiff, checkChangeLabels, compareRevisionChecks, compareRevisionMetadata, type TextChange } from "@/lib/revision-comparison";
import { CheckBadge } from "./ui";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import { styles } from "./revision-comparison.styles";

export function RevisionComparison({ current, previous }: { current: Revision; previous: Revision }) {
  const diff = useMemo(() => buildTextDiff(previous.input.content, current.input.content), [previous.input.content, current.input.content]);
  const metadata = compareRevisionMetadata(previous, current);
  const checks = compareRevisionChecks(previous, current);
  const changedChecks = checks.filter(change => change.kind !== "unchanged");
  const unchangedCount = checks.length - changedChecks.length;
  const textChanged = previous.input.content !== current.input.content;
  return (
    <section className={styles.comparison} aria-labelledby="comparison-title">
      <header className={styles.heading}><DashboardIcon name="columns-3" size={17} /><h2 id="comparison-title">Revision {previous.number} → {current.number}</h2><span>Previous → selected</span></header>
      <p className={styles.scope}>Changes help focus your review. Checks cover the whole submitted copy; unchanged text and historical decisions do not clear this revision.</p>
      <section className={styles.section} aria-labelledby="text-changes-title">
        <div className={styles.sectionHeading}><h3 id="text-changes-title">Text changes</h3>{textChanged && <span className={styles.legend}><del>Removed</del><ins>Added</ins></span>}</div>
        {textChanged ? <>
          <p className={styles.hint}>{diff.grouped ? "Large edits are grouped. Open the full copies below to read all context." : "Unchanged passages are shortened. Open the full copies below for all context."}</p>
          <div className={styles.diff} tabIndex={0} role="region" aria-label={`Text changes from revision ${previous.number} to ${current.number}`}>
            {diff.parts.map((part, index) => <DiffPart key={index} part={part} first={index === 0} last={index === diff.parts.length - 1} />)}
          </div>
        </> : <p className={styles.hint}>The submitted text is identical. {metadata.length ? "Review the changed context below." : "No text changes."}</p>}
        <details className={styles.fullCopy}>
          <summary>Read full copies · revisions {previous.number} and {current.number}</summary>
          <div className={styles.columns}>
            {[previous, current].map((version, index) => <div key={version.id}><h4>{index === 0 ? "Previous" : "Selected"} · revision {version.number}</h4><div className={styles.copy} tabIndex={0} role="region" aria-label={`Full marketing copy, revision ${version.number}`}>{version.input.content}</div></div>)}
          </div>
        </details>
      </section>
      <section className={styles.section} aria-labelledby="context-changes-title">
        <h3 id="context-changes-title">Changed context <span>{metadata.length}</span></h3>
        {metadata.length ? <dl className={styles.metadata}>{metadata.map(change => <div key={change.label}>
          <dt>{change.label}</dt><dd><span>Previous · revision {previous.number}</span>{change.previous}</dd><dd><span>Selected · revision {current.number}</span>{change.current}</dd>
        </div>)}</dl> : <p className={styles.hint}>No metadata or reference changes.</p>}
      </section>
      <section className={styles.section} aria-labelledby="check-changes-title">
        <h3 id="check-changes-title">Concern changes</h3>
        <p className={styles.hint}>{checks.filter(change => change.kind === "new").length} newly flagged · {checks.filter(change => change.kind === "updated").length} changed evidence or outcome · {checks.filter(change => change.kind === "cleared").length} no longer flagged · {unchangedCount} unchanged{checks.some(change => change.kind === "not_checked") ? ` · ${checks.filter(change => change.kind === "not_checked").length} not checked` : ""}.</p>
        {changedChecks.map(change => <details className={styles.checkChange} key={(change.current ?? change.previous)!.ruleId} open={change.kind === "updated"}>
          <summary><strong>{(change.current ?? change.previous)!.title}</strong><span>{checkChangeLabels[change.kind]}</span></summary>
          <div className={styles.columns}>
            <EvidenceSnapshot check={change.previous} revision={previous.number} label="Previous" />
            <EvidenceSnapshot check={change.current} revision={current.number} label="Selected" />
          </div>
        </details>)}
        {unchangedCount > 0 && <details className={styles.unchanged}><summary>{unchangedCount} still flagged with unchanged evidence</summary><ul>{checks.filter(change => change.kind === "unchanged").map(change => <li key={change.current!.ruleId}>{change.current!.title}</li>)}</ul></details>}
        {checks.length === 0 && <p className={styles.hint}>Neither revision has automated concerns. Human review is still required.</p>}
      </section>
    </section>
  );
}

function DiffPart({ part, first, last }: { part: TextChange; first: boolean; last: boolean }) {
  if (part.kind === "unchanged") {
    if (part.text.length <= 240) return <span>{part.text}</span>;
    return <span>{!first && part.text.slice(0, 100)}<span className={styles.omitted} aria-label="Unchanged text omitted"> … </span>{!last && part.text.slice(-100)}</span>;
  }
  const text = part.text.trim() ? part.text : part.text.replace(/ /g, "·").replace(/\t/g, "→").replace(/\n/g, "↵\n").replace(/\r/g, "␍");
  return part.kind === "removed"
    ? <del><span className="sr-only">Removed: </span>{text}</del>
    : <ins><span className="sr-only">Added: </span>{text}</ins>;
}

function EvidenceSnapshot({ check, revision, label }: { check?: CheckResult; revision: number; label: string }) {
  return <div className={styles.evidence}><h4>{label} · revision {revision}</h4>{check ? <>
    <CheckBadge status={check.status} />
    <p>{check.status === "finding" ? `${check.severity === "high" ? "High" : check.severity === "medium" ? "Medium" : "Informational"} severity · ` : ""}{{ mismatch: "Offer mismatch", missing_information: "Missing information", human_judgment: "Human judgment", disclosure: "Disclosure", context: "Review context" }[check.kind]}</p>
    <p>{check.explanation}</p>
    {check.excerpt && <blockquote>“{check.excerpt.text}”</blockquote>}
    {check.suggestion && <p><strong>Suggested next step</strong>{check.suggestion}</p>}
    <p className={styles.reference}>{{ regulatory_reference: "Regulatory reference", company_policy: "ClearPath policy", product_fact: "Product fact" }[check.reference.type]} · {check.reference.url ? <a href={check.reference.url} target="_blank" rel="noreferrer">{check.reference.label}</a> : check.reference.label}</p>
  </> : <p>This rule was not recorded on this revision.</p>}</div>;
}
