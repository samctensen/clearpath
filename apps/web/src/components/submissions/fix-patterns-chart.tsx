"use client";

import { useId, useState } from "react";
import { fixReasonDefinitions, type FixPattern, type FixPatternSource, type FixPatternSummary } from "@clearpath/contracts";
import { usePendingHeight } from "@/lib/use-pending-height";
import styles from "./fix-patterns-chart.module.css";

export const fixPatternSourceLabels: Record<FixPatternSource, string> = {
  missing_information: "Needs information",
  reviewer_request: "Reviewer request",
  unavailable: "Source unavailable",
};
const sourceLabels = fixPatternSourceLabels;
const reasonOrder = new Map(fixReasonDefinitions.map((reason, index) => [reason.id, index]));
const initialReasonCount = 4;
const submissions = (count: number) => `${count} submission${count === 1 ? "" : "s"}`;

export function FixPatternsChart({ summary, selectedReason, loading, error, onSelect, onRetry }: {
  summary: FixPatternSummary | null;
  selectedReason: string | null;
  loading: boolean;
  error: string | null;
  onSelect(reason: string | null): void;
  onRetry(): void;
}) {
  const headingId = useId();
  const chartId = useId();
  const noteId = useId();
  const [expanded, setExpanded] = useState(false);
  const layout = usePendingHeight<HTMLElement>(loading);
  const reasons = (summary?.reasons ?? [])
    .filter(reason => reason.count > 0)
    .sort((a, b) => b.count - a.count || (reasonOrder.get(a.id) ?? Infinity) - (reasonOrder.get(b.id) ?? Infinity) || a.id.localeCompare(b.id));
  const selected = selectedReason ? summary?.reasons.find(reason => reason.id === selectedReason) ?? {
    ...(fixReasonDefinitions.find(reason => reason.id === selectedReason) ?? {
      id: selectedReason,
      label: "Selected reason",
      source: "unavailable" as const,
      description: "This reason is no longer available in the current results.",
    }),
    count: 0,
  } : null;
  const visibleReasons = expanded ? reasons : reasons.filter((reason, index) => index < initialReasonCount || reason.id === selectedReason);
  // Keep a vanished selection visible without counting it as a current reason.
  const chartReasons = selected?.count === 0 ? [...visibleReasons, selected] : visibleReasons;
  const hiddenCount = reasons.length - visibleReasons.length;
  const selectedOutsideTop = selected && reasons.findIndex(reason => reason.id === selected.id) >= initialReasonCount;
  const scaleMax = Math.max(1, ...reasons.map(reason => reason.count));
  const ticks = scaleMax > 1 ? [0, Math.floor(scaleMax / 2), scaleMax] : [0, 1];
  const hasChart = reasons.length > 0;
  const unavailable = !summary || (summary.total > 0 && reasons.length === 0);

  return <section className={styles.panel} aria-labelledby={headingId} aria-busy={loading} {...layout}>
    <header className={styles.heading}>
      <div>
        <h2 id={headingId}>What needs input</h2>
        <p>{!loading && !error && summary
          ? <><strong>{submissions(summary.total)}</strong> {summary.total === 1 ? "needs" : "need"} changes or information</>
          : "Current requests and information gaps"}</p>
      </div>
      <span className={styles.scope}>Current revisions</span>
    </header>

    {loading ? <div className={styles.loading} role="status">
      <span className={styles.loadingLabel}>Loading fix patterns…</span>
      <div className={styles.skeletonRows} aria-hidden="true">{[84, 68, 48, 36].map(width => <div className={styles.skeletonRow} key={width}><span /><i style={{ width: `${width}%` }} /><b /></div>)}</div>
    </div> : error || unavailable ? <div className={styles.state} role="alert">
      <h3>Couldn’t load fix patterns</h3>
      <p>{error || "Reason details aren’t available right now."}</p>
      <button type="button" className={styles.action} onClick={onRetry}>Try again</button>
    </div> : <>
      {hasChart ? <>
        <div className={styles.axis} aria-hidden="true">
          <span className={styles.axisLabel}>Submissions by reason</span>
          <div className={styles.scale}>{ticks.map(tick => <span key={tick} style={{ left: `${tick / scaleMax * 100}%` }}>{tick}</span>)}</div>
          <span className={styles.countLabel}>Count</span>
        </div>
        <ul id={chartId} className={styles.chart} aria-label="Submissions by reason" aria-describedby={noteId} data-has-selection={Boolean(selected)}>
          {chartReasons.map(reason => <ReasonBand key={reason.id} reason={reason} selected={reason.id === selectedReason} scaleMax={scaleMax} ticks={ticks} onSelect={() => onSelect(reason.id === selectedReason ? null : reason.id)} />)}
        </ul>
        <div className={styles.chartFooter}>
          <p id={noteId}>Some submissions appear in more than one reason.</p>
          {reasons.length > initialReasonCount && (expanded || hiddenCount > 0) && <button type="button" className={styles.expand} aria-expanded={expanded} aria-controls={chartId} onClick={() => setExpanded(value => !value)}>
            {expanded ? "Show top reasons" : `Show ${hiddenCount} more reason${hiddenCount === 1 ? "" : "s"}`}
            <span className={styles.chevron} data-expanded={expanded} aria-hidden="true" />
          </button>}
          {!expanded && selectedOutsideTop && <span className={styles.keptVisible}>Selected reason kept in view</span>}
        </div>
      </> : <div className={styles.state}>
        <h3>No changes or information needed</h3>
        <p>No current submissions in this search and product selection need your input.</p>
      </div>}

      {(hasChart || selected) && <div className={styles.context} data-selected={Boolean(selected)}>
        <div className={styles.explanation} aria-live="polite" aria-atomic="true">
          {selected ? <>
            <div className={styles.contextHeading}><span className={styles.sourceMark} data-source={selected.source} aria-hidden="true" /><strong>{selected.label}</strong><span>{sourceLabels[selected.source]}</span></div>
            <p>{selected.count === 0 ? "No submissions currently match this reason in your search and product selection. Clear the reason to see other submissions needing input." : <>{selected.description}{selected.source !== "unavailable" && " See the recorded text in each submission below."}</>}</p>
          </> : <>
            <strong>Select a reason to filter the submissions below.</strong>
            <p>Needs information comes from checks that need more context. Reviewer requests come from recorded feedback.</p>
          </>}
        </div>
        {selected && <button type="button" className={styles.action} onClick={() => onSelect(null)}>Clear reason</button>}
      </div>}
    </>}
  </section>;
}

function ReasonBand({ reason, selected, scaleMax, ticks, onSelect }: {
  reason: FixPattern;
  selected: boolean;
  scaleMax: number;
  ticks: number[];
  onSelect(): void;
}) {
  return <li className={styles.reason}>
    <button type="button" className={styles.band} data-source={reason.source} data-zero={reason.count === 0} aria-pressed={selected} aria-label={`${reason.label}, ${sourceLabels[reason.source]}, ${submissions(reason.count)}. ${selected ? "Clear reason filter" : "Filter submissions by this reason"}.`} onClick={onSelect}>
      <span className={styles.category}><span className={styles.label}>{reason.label}</span><span className={styles.source}><span className={styles.sourceMark} aria-hidden="true" />{sourceLabels[reason.source]}</span></span>
      <span className={styles.plot} aria-hidden="true">
        <span className={styles.grid}>{ticks.map(tick => <i key={tick} style={{ left: `${tick / scaleMax * 100}%` }} />)}</span>
        <span className={styles.fill} style={{ width: `${reason.count / scaleMax * 100}%` }}><span className={styles.cap} /></span>
      </span>
      <strong className={styles.count} aria-hidden="true">{reason.count}</strong>
    </button>
  </li>;
}
