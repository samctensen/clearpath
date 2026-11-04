import type { CaseStatus } from "@clearpath/contracts";
import type { CSSProperties } from "react";
import styles from "./review-pipeline.module.css";

type ReviewPipelineProps = {
  counts: Record<CaseStatus, number>;
  total: number;
  selected: CaseStatus | "all";
  onSelect: (status: CaseStatus) => void;
};

const segments: { status: CaseStatus; label: string; color: string; className: string }[] = [
  { status: "ready_for_review", label: "Ready for review", color: "var(--dash-ready)", className: styles.ready },
  { status: "needs_information", label: "Needs information", color: "var(--dash-info)", className: styles.info },
  { status: "changes_requested", label: "Changes requested", color: "var(--dash-waiting)", className: styles.waiting },
  { status: "approved", label: "Copy approved", color: "var(--dash-approved)", className: styles.approved },
];

const center = 130;
const radius = 88;
const circumference = 2 * Math.PI * radius;
const gap = 5;
// Constant decoration: 72 ticks at fixed angles, independent of the data.
const ticks = Array.from({ length: 72 }, (_, index) => {
  const angle = (index / 72) * 2 * Math.PI;
  const major = index % 6 === 0;
  const outer = 122;
  const inner = major ? 112 : 117;
  return {
    major,
    x1: center + Math.sin(angle) * inner,
    y1: center - Math.cos(angle) * inner,
    x2: center + Math.sin(angle) * outer,
    y2: center - Math.cos(angle) * outer,
  };
});

function formatPercent(count: number, sum: number) {
  if (sum <= 0) return "0%";
  const percent = (count / sum) * 100;
  return `${percent > 0 && percent < 1 ? "<1" : Math.round(percent)}%`;
}

export function ReviewPipeline({ counts, total, selected, onSelect }: ReviewPipelineProps) {
  const sum = segments.reduce((acc, { status }) => acc + counts[status], 0);
  const visible = segments.filter(({ status }) => counts[status] > 0);
  const separated = visible.length > 1;
  const empty = total === 0 || sum === 0;

  let cursor = 0;
  const arcs = visible.map((segment) => {
    const length = (counts[segment.status] / sum) * circumference;
    const segmentGap = separated ? Math.min(gap, length * .1) : 0;
    const dash = length - segmentGap;
    const offset = -(cursor + segmentGap / 2);
    cursor += length;
    return { ...segment, dash, offset };
  });

  return (
    <section className={styles.panel} aria-labelledby="review-pipeline-title">
      <header className={styles.header}>
        <h2 id="review-pipeline-title" className={styles.title}>Review status</h2>
        <p className={styles.subtitle}>Current workflow status</p>
      </header>

      <div className={styles.body}>
        <div className={styles.instrument}>
          <svg className={styles.chart} viewBox="0 0 260 260" aria-hidden="true" focusable="false">
            <g className={styles.ticks}>
              {ticks.map((tick, index) => (
                <line
                  key={index}
                  className={tick.major ? styles.tickMajor : styles.tick}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                />
              ))}
            </g>
            <circle className={styles.guide} cx={center} cy={center} r={radius + 20} />
            <circle className={styles.track} cx={center} cy={center} r={radius} />
            {!empty && (
              <g transform={`rotate(-90 ${center} ${center})`}>
                {arcs.map((arc) => (
                  <circle
                    key={arc.status}
                    className={`${styles.arc} ${arc.className} ${selected !== "all" && selected !== arc.status ? styles.dimmed : ""}`}
                    cx={center}
                    cy={center}
                    r={radius}
                    strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                    strokeDashoffset={arc.offset}
                  />
                ))}
              </g>
            )}
            <circle className={styles.inner} cx={center} cy={center} r={radius - 20} />
          </svg>
          <div className={styles.center}>
            <span className={styles.centerLabel}>Submissions</span>
            <strong className={styles.centerValue}>{total}</strong>
            <span className={styles.centerNote}>{empty ? "None yet" : "in this view"}</span>
          </div>
        </div>

        <ul className={styles.legend}>
          {segments.map(({ status, label, color }) => (
            <li key={status}>
              <button
                type="button"
                className={styles.item}
                aria-pressed={selected === status}
                onClick={() => onSelect(status)}
                style={{ "--status-color": color } as CSSProperties}
              >
                <span className={styles.swatch} aria-hidden="true" />
                <span className={styles.label}>{label}</span>
                <span className={styles.percent} aria-hidden="true">{formatPercent(counts[status], sum)}</span>
                <span className={styles.count}>{counts[status]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.footer}>
        {empty ? "No submissions match this view yet. " : ""}Select a status to filter the queue.
      </p>
    </section>
  );
}
