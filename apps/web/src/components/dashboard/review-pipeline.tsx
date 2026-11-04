"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CaseStatus, CaseSummary } from "@clearpath/contracts";
import styles from "./review-pipeline.module.css";
import { DashboardIcon } from "./dashboard-icon";
import { buildLaunchHorizon, formatShort, formatFull, TOP, BOTTOM } from "@/lib/launch-horizon";

type ReviewPipelineProps = {
  counts: Record<CaseStatus, number>;
  cases: CaseSummary[];
  today: string;
  selected: CaseStatus | "all";
  onSelect: (status: CaseStatus) => void;
};

const lanes: { status: CaseStatus; label: string; className: string }[] = [
  { status: "ready_for_review", label: "Ready for review", className: styles.ready },
  { status: "needs_information", label: "Needs information", className: styles.info },
  { status: "changes_requested", label: "Changes requested", className: styles.waiting },
  { status: "approved", label: "Copy approved", className: styles.approved },
];

function plural(count: number, one: string) {
  return `${count} ${one}${count === 1 ? "" : "s"}`;
}

export function ReviewPipeline({ counts, cases, today, selected, onSelect }: ReviewPipelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const model = useMemo(() => buildLaunchHorizon(cases, today), [cases, today]);
  const { dated, todayDay, window, span, plotMin, layouts, pitch, laneHeights, laneTops, inner, ticks, focusDay, focusCount } = model;
  const scrollerRef = useRef<HTMLDivElement>(null);

  const frac = (day: number) => (window ? (day - window.start) / span : 0);
  const todayFrac = todayDay !== null && window ? frac(todayDay) : null;
  const focusFrac = focusDay !== null && window ? frac(focusDay) : null;
  const anchor = focusFrac ?? (dated[0] ? frac(dated[0].day) : todayFrac);
  const delta = focusDay !== null && todayDay !== null ? focusDay - todayDay : null;
  const undated = cases.length - dated.length;
  const empty = cases.length === 0;
  const height = TOP + inner + BOTTOM;
  const active = dated.find(({ item }) => item.id === activeId)
    ?? dated.find(({ item }) => selected !== "all" && item.status === selected)
    ?? dated.find(({ item, day }) => item.status !== "approved" && day === focusDay)
    ?? dated[0];
  const productCode = { card: "CC", personal_loan: "PL", mortgage: "MT", unknown: "OT" };
  const productName = { card: "Credit card", personal_loan: "Personal loan", mortgage: "Mortgage", unknown: "Other product" };

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || anchor === null || scroller.scrollWidth <= scroller.clientWidth) return;
    scroller.scrollLeft = Math.max(0, anchor * scroller.scrollWidth - scroller.clientWidth / 2);
  }, [anchor, plotMin]);

  const todaySide = delta !== null && delta > 0 ? "end" : "start";
  const focusSide = delta !== null && delta < 0 ? "end" : "start";
  const dimLow = todayFrac !== null && focusFrac !== null ? Math.min(todayFrac, focusFrac) : 0;
  const dimHigh = todayFrac !== null && focusFrac !== null ? Math.max(todayFrac, focusFrac) : 0;
  const dimShort = (dimHigh - dimLow) * plotMin < 96;

  let signalValue = "—";
  let signalUnit = "";
  let signalNote = empty ? "No submissions in this view" : "No open targets in this view";
  if (focusDay !== null) {
    signalNote = `${formatFull(focusDay)} · ${plural(focusCount, "open submission")} on this date`;
    if (delta === null) {
      signalValue = formatShort(focusDay);
    } else if (delta === 0) {
      signalValue = "0";
      signalUnit = "days · due today";
    } else {
      signalValue = String(Math.abs(delta));
      signalUnit = `${Math.abs(delta) === 1 ? "day" : "days"} ${delta > 0 ? "away" : "past target"}`;
    }
  }

  const plotMessage = !window
    ? empty
      ? "No submissions in this view yet."
      : `${plural(undated, "submission")} without a valid target date. Nothing to plot.`
    : dated.length === 0
      ? `${plural(undated, "submission")} without a valid target date. Nothing to plot.`
      : null;

  return (
    <section className={styles.panel} aria-labelledby="review-pipeline-title">
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <p className={styles.index}>Target dates × workflow</p>
          <h2 id="review-pipeline-title" className={styles.title}>Launch horizon</h2>
          <p className={styles.subtitle}>
            Every submission, mapped to its target launch date.
          </p>
        </div>
        <div className={styles.signal}>
          <span className={styles.signalLabel}>Earliest open target</span>
          <strong className={styles.signalValue}>
            {signalValue}
            {signalUnit && <span className={styles.signalUnit}>{signalUnit}</span>}
          </strong>
          <span className={styles.signalNote}>{signalNote}</span>
        </div>
      </header>

      <div className={styles.horizon}>
        <ul className={styles.lanes} style={{ paddingTop: TOP, paddingBottom: BOTTOM }}>
          {lanes.map((lane, index) => (
            <li key={lane.status} className={styles.laneItem} style={{ height: laneHeights[index] }}>
              <button
                type="button"
                className={`${styles.lane} ${lane.className}`}
                aria-pressed={selected === lane.status}
                onClick={() => { setActiveId(null); onSelect(lane.status); }}
              >
                <span className={styles.laneIndex}>
                  <i className={styles.laneSwatch} aria-hidden="true" />
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className={styles.laneCount}>{counts[lane.status]}</span>
                <span className={styles.laneLabel}>{lane.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div
          ref={scrollerRef}
          className={styles.scroller}
          role="region"
          aria-label="Launch horizon plot, scrolls sideways on narrow screens"
          tabIndex={0}
        >
          <div className={styles.plot} style={{ minWidth: window ? plotMin : 0, height }}>
            {lanes.map((lane, index) => (
              <div
                key={lane.status}
                className={`${styles.band} ${selected === lane.status ? styles.bandSelected : ""}`}
                style={{ top: TOP + laneTops[index], height: laneHeights[index] }}
                aria-hidden="true"
              />
            ))}

            {window && (
              <div className={styles.axis} style={{ top: TOP + inner }} aria-hidden="true">
                {span <= 120 && Array.from({ length: span + 1 }, (_, offset) => (
                  <i key={offset} className={styles.minor} style={{ left: `${(offset / span) * 100}%` }} />
                ))}
                {ticks.map((tick) => (
                  <span key={tick.day} className={styles.tick} style={{ left: `${frac(tick.day) * 100}%` }}>
                    <span className={styles.tickLabel}>{tick.label}</span>
                    {tick.year && <span className={styles.tickYear}>{tick.year}</span>}
                  </span>
                ))}
              </div>
            )}

            {window && ticks.map((tick) => (
              <i
                key={tick.day}
                className={styles.grid}
                style={{ left: `${frac(tick.day) * 100}%`, top: TOP, height: inner }}
                aria-hidden="true"
              />
            ))}

            {focusFrac !== null && focusDay !== null && (
              <>
                <i className={styles.targetLine} style={{ left: `${focusFrac * 100}%`, top: 22, height: TOP + inner - 22 }} aria-hidden="true" />
                {delta !== 0 && (
                  <span
                    className={styles.tag}
                    style={focusSide === "start" ? { left: `calc(${focusFrac * 100}% + 7px)` } : { right: `calc(${(1 - focusFrac) * 100}% + 7px)` }}
                    aria-hidden="true"
                  >
                    {formatShort(focusDay)}
                  </span>
                )}
              </>
            )}

            {todayFrac !== null && todayDay !== null && (
              <>
                <i className={styles.today} style={{ left: `${todayFrac * 100}%`, top: 0, height: TOP + inner + 10 }} aria-hidden="true" />
                <span
                  className={`${styles.tag} ${styles.tagToday}`}
                  style={todaySide === "start" ? { left: `calc(${todayFrac * 100}% + 7px)` } : { right: `calc(${(1 - todayFrac) * 100}% + 7px)` }}
                  aria-hidden="true"
                >
                  Today {formatShort(todayDay)}{delta === 0 ? " · due" : ""}
                </span>
              </>
            )}

            {delta !== null && delta !== 0 && (
              <>
                <i
                  className={styles.dim}
                  style={{ left: `${dimLow * 100}%`, width: `${(dimHigh - dimLow) * 100}%`, top: 34 }}
                  aria-hidden="true"
                />
                <span
                  className={`${styles.dimLabel} ${dimShort ? styles.dimOutside : ""}`}
                  style={dimShort ? { left: `calc(${dimHigh * 100}% + 10px)`, top: 34 } : { left: `${((dimLow + dimHigh) / 2) * 100}%`, top: 34 }}
                  aria-hidden="true"
                >
                  {Math.abs(delta)} {Math.abs(delta) === 1 ? "day" : "days"}{delta < 0 ? " past" : ""}
                </span>
              </>
            )}

            {layouts.map((layout, laneIndex) => {
              const lane = lanes[laneIndex];
              return layout.placed.map((entry) => {
                const { item } = entry;
                const mid = TOP + laneTops[laneIndex] + laneHeights[laneIndex] / 2;
                const offset = (entry.slot - (layout.heights[entry.cluster] - 1) / 2) * pitch;
                const dimmed = selected !== "all" && selected !== lane.status;
                return (
                  <Link
                    key={item.id}
                    href={`/cases/${encodeURIComponent(item.id)}`}
                    className={[
                      styles.marker,
                      lane.className,
                      dimmed ? styles.dimmed : "",
                      item.id === active?.item.id ? styles.markerFocus : "",
                    ].join(" ")}
                    style={{ left: `${entry.frac * 100}%`, top: mid + offset }}
                    aria-label={`${item.title}, ${lane.label}, target ${formatFull(entry.day)}`}
                    onMouseEnter={() => setActiveId(item.id)}
                    onFocus={() => setActiveId(item.id)}
                  >
                    <span aria-hidden="true">{productCode[item.productId]}</span>
                  </Link>
                );
              });
            })}

            {plotMessage && <p className={styles.empty}>{plotMessage}</p>}
          </div>
        </div>
      </div>

      {active && <Link className={styles.inspector} href={`/cases/${encodeURIComponent(active.item.id)}`}>
        <span className={styles.inspectorIcon}><DashboardIcon name="file-lines" size={18} /></span>
        <span className={styles.inspectorBody}><strong>{active.item.title}</strong><small>{productName[active.item.productId]} · {lanes.find(lane => lane.status === active.item.status)?.label} · Target {formatFull(active.day)}</small></span>
        <span className={styles.inspectorAction}>Open review<DashboardIcon name="arrow-up-right" size={14} /></span>
      </Link>}

      <footer className={styles.footer}>
        <span>
          {empty ? "No submissions match this view yet. " : ""}
          Select a status to filter. Open a marker to review its copy.
        </span>
        {window && <span className={styles.hint}>Scroll the plot sideways →</span>}
        <span className={styles.caption}>
          {dated.length} of {cases.length} plotted
          {undated > 0 ? ` · ${undated} undated, not on the plot` : ""}
        </span>
      </footer>
    </section>
  );
}
