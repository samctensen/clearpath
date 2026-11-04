"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatLabels, productLabels, statusLabels, type CaseStatus, type CaseSummary } from "@clearpath/contracts";
import { buildReviewMap } from "@/lib/review-map";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./review-map.module.css";

type ReviewMapProps = {
  cases: CaseSummary[];
  selected: CaseStatus | "all";
  onSelect: (status: CaseStatus) => void;
  preferredCaseId?: string;
};

// Keep in sync with .row height and .diagram padding in the stylesheet.
const ROW = 44;
// Normalized horizontal coordinates keep each curve and rail in one path.
const FIELD_WIDTH = 1000;
const FIELD_HEIGHT = ROW * 4;
const ORIGIN_Y = FIELD_HEIGHT / 2;
// Matches --status-width and the 36px destination buttons in the stylesheet.
const STATUS_WIDTH = 196;

const statusClass: Record<CaseStatus, string> = {
  ready_for_review: styles.ready,
  needs_information: styles.info,
  changes_requested: styles.waiting,
  approved: styles.approved,
};

const dateFormat = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function targetLabel(value: string) {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? dateFormat.format(date) : "Date unavailable";
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function branchPath(index: number, width = FIELD_WIDTH) {
  const y = ROW / 2 + index * ROW;
  const scale = width / FIELD_WIDTH;
  return `M0 ${ORIGIN_Y} H${36 * scale} C${140 * scale} ${ORIGIN_Y} ${180 * scale} ${y} ${320 * scale} ${y} H${width}`;
}

// One uninterrupted route: branch → left edge → destination perimeter.
function particlePath(index: number, width: number, statusWidth: number, statusHeight: number) {
  const left = width - statusWidth;
  const y = ROW / 2 + index * ROW;
  const half = statusHeight / 2 - 1;
  const corner = half - 8;
  return `${branchPath(index, left)} H${left + 1} V${y - corner} Q${left + 1} ${y - half} ${left + 9} ${y - half} H${width - 9} Q${width - 1} ${y - half} ${width - 1} ${y - corner} V${y + corner} Q${width - 1} ${y + half} ${width - 9} ${y + half} H${left + 9} Q${left + 1} ${y + half} ${left + 1} ${y + corner} V${y}`;
}

export function ReviewMap({ cases, selected, onSelect, preferredCaseId }: ReviewMapProps) {
  const openRef = useRef<HTMLAnchorElement>(null);
  const networkRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState({ width: 0, statusWidth: STATUS_WIDTH, statusHeight: 36, compact: false });

  useEffect(() => {
    const network = networkRef.current;
    if (!network) return;
    const observer = new ResizeObserver(([entry]) => {
      const css = getComputedStyle(network);
      setGeometry({
        width: entry.contentRect.width,
        statusWidth: Number.parseFloat(css.getPropertyValue("--status-width")) || STATUS_WIDTH,
        statusHeight: Number.parseFloat(css.getPropertyValue("--status-height")) || 36,
        compact: css.getPropertyValue("--compact-map").trim() === "1",
      });
    });
    observer.observe(network);
    return () => observer.disconnect();
  }, []);
  const model = useMemo(() => buildReviewMap(cases, preferredCaseId), [cases, preferredCaseId]);
  const [hoveredStatus, setHoveredStatus] = useState<CaseStatus | null>(null);
  const [picked, setPicked] = useState<{ id: string; filter: CaseStatus | "all"; preferred?: string } | null>(null);

  // A deliberate preview can inspect any branch. Changing the queue filter or role
  // invalidates that preview and selects a matching record instead.
  const pool = selected === "all"
    ? model.groups.flatMap((group) => group.items)
    : model.groups.find((group) => group.status === selected)?.items ?? [];
  const preview = picked?.filter === selected && picked?.preferred === preferredCaseId
    ? cases.find((item) => item.id === picked.id) : undefined;
  const active = preview
    ?? pool.find((item) => item.id === model.initialCaseId)
    ?? pool[0]
    ?? null;
  // On small screens keep the actual paths; limit dots to the usable straight rail.
  // Overflow stays explicit and leads to the complete queue, never overlapping labels.
  const groups = model.groups.map((group) => {
    if (!geometry.compact || geometry.width === 0) return group;
    const space = (geometry.width - geometry.statusWidth) * .68 - 4;
    const capacity = Math.max(1, Math.floor(space / 44));
    const limit = group.count > capacity ? Math.max(1, Math.floor((space - 44) / 44)) : capacity;
    const visible = group.visible.slice(0, limit);
    if (active?.status === group.status && !visible.some((item) => item.id === active.id)) {
      visible[visible.length - 1] = active;
    }
    return { ...group, visible, hiddenCount: group.count - visible.length };
  });
  const plotted = groups.reduce((count, group) => count + group.visible.length, 0);
  const focusStatus = active?.status ?? (selected === "all" ? null : selected);
  const emphasizedStatus = hoveredStatus ?? focusStatus;
  const selectedGroupIndex = model.groups.findIndex((group) => group.status === selected && group.count > 0);
  const inspect = (id: string) => setPicked({ id, filter: selected, preferred: preferredCaseId });

  const summary = model.total === 0
    ? "No submissions in this view"
    : model.open === 0
      ? `${plural(model.total, "submission")} · all copy approved`
      : `${model.open} open · ${model.followUp} need follow-up`;

  const selectStatus = (status: CaseStatus) => {
    setPicked(null);
    onSelect(status);
  };

  return (
    <section className={styles.panel} aria-labelledby="review-map-title">
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h2 id="review-map-title" className={styles.title}>Review map</h2>
          <p className={styles.subtitle}>
            Each dot is a submission, grouped by current status.
            {plotted < model.total && ` Showing ${plotted} of ${model.total}; the rest are in the queue.`}
          </p>
        </div>
        <p className={styles.summary}>{summary}</p>
      </header>

      <div className={styles.diagram} role="group" aria-label={`Submissions by review status, ${plural(model.total, "submission")}`}>
        <div className={styles.origin} aria-hidden="true">
          <span className={styles.originCount}>{model.total}</span>
          <span className={styles.originLabel}>in view</span>
          <i className={styles.originNode} />
        </div>

        <div ref={networkRef} className={styles.network}>
          <svg className={styles.field} viewBox={`0 0 ${FIELD_WIDTH} ${FIELD_HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
            {groups.map((group, index) => (
              <g
                key={group.status}
                onMouseEnter={() => setHoveredStatus(group.status)}
                onMouseLeave={() => setHoveredStatus(null)}
                className={[
                  styles.branchGroup,
                  statusClass[group.status],
                  group.count === 0 ? styles.branchEmpty : "",
                  emphasizedStatus === group.status ? styles.branchActive : "",
                  selected === group.status ? styles.branchSelected : "",
                  selected !== "all" && selected !== group.status && emphasizedStatus !== group.status ? styles.branchDim : "",
                ].join(" ")}
              >
                <path d={branchPath(index)} className={styles.branchHalo} vectorEffect="non-scaling-stroke" />
                <path d={branchPath(index)} className={styles.branch} vectorEffect="non-scaling-stroke" />
                {selected === group.status && group.count > 0 && (
                  <path d={branchPath(index)} className={styles.branchTrace} pathLength={1} vectorEffect="non-scaling-stroke" />
                )}
                <path d={branchPath(index)} className={styles.branchHit} vectorEffect="non-scaling-stroke" onClick={() => selectStatus(group.status)} />
              </g>
            ))}
          </svg>
          {selectedGroupIndex >= 0 && geometry.width > geometry.statusWidth && (
            <svg className={`${styles.particleField} ${statusClass[model.groups[selectedGroupIndex].status]}`} viewBox={`0 0 ${geometry.width} ${FIELD_HEIGHT}`} aria-hidden="true">
              {[0, 1].map((particle) => (
                <path key={`${selected}-${particle}`} d={particlePath(selectedGroupIndex, geometry.width, geometry.statusWidth, geometry.statusHeight)} className={styles.particle} pathLength={100} style={{ animationDelay: `${particle * -7}s` }} />
              ))}
            </svg>
          )}

          <div className={styles.rows}>
            {groups.map((group) => {
              const dimmed = selected !== "all" && selected !== group.status && emphasizedStatus !== group.status;
              return (
                <div
                  key={group.status}
                  onMouseEnter={() => setHoveredStatus(group.status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  className={[
                    styles.row,
                    statusClass[group.status],
                    emphasizedStatus === group.status ? styles.rowActive : "",
                    dimmed ? styles.rowDim : "",
                  ].join(" ")}
                >
                  <div className={`${styles.track} ${group.count === 0 ? styles.trackEmpty : ""}`}>
                    {group.visible.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`${styles.token} ${item.id === active?.id ? styles.tokenActive : ""}`}
                        aria-label={`${item.title}, ${group.label}, target ${targetLabel(item.launchDate)}`}
                        aria-current={item.id === active?.id ? "true" : undefined}
                        aria-controls="review-map-inspector"
                        onMouseEnter={() => inspect(item.id)}
                        onFocus={() => inspect(item.id)}
                        onClick={() => {
                          inspect(item.id);
                          openRef.current?.focus();
                        }}
                      />
                    ))}
                    {group.hiddenCount > 0 && <a
                      href="#submissions"
                      className={styles.more}
                      aria-label={`Show ${group.hiddenCount} more ${group.label.toLowerCase()} submissions in the queue`}
                      onClick={() => { if (selected !== group.status) selectStatus(group.status); }}
                    >+{group.hiddenCount}</a>}
                    {group.count === 0 && <span className={styles.none}>None</span>}
                  </div>
                  <button
                    type="button"
                    className={styles.status}
                    aria-pressed={selected === group.status}
                    onFocus={() => setHoveredStatus(group.status)}
                    onBlur={() => setHoveredStatus(null)}
                    onClick={() => selectStatus(group.status)}
                  >
                    <span className={styles.statusLabel}>{group.label}</span>
                    <span className={styles.statusCount}>{group.count}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div id="review-map-inspector" className={styles.inspector}>
        {active ? <>
          <div className={styles.record}>
            <p className={styles.recordTitle}>
              <i className={`${styles.recordDot} ${statusClass[active.status]}`} aria-hidden="true" />
              <strong>{active.title}</strong>
            </p>
            <dl className={styles.meta}>
              <div><dt>Status</dt><dd>{statusLabels[active.status]}</dd></div>
              <div><dt>Product</dt><dd>{productLabels[active.productId]} · {formatLabels[active.format]}</dd></div>
              <div><dt>Revision</dt><dd>Rev {active.revision}</dd></div>
              <div><dt>Target</dt><dd>{targetLabel(active.launchDate)}</dd></div>
              <div><dt>Findings</dt><dd>{active.findings}</dd></div>
              <div><dt>Unknowns</dt><dd>{active.unknowns}</dd></div>
            </dl>
          </div>
          <Link ref={openRef} className={styles.open} href={`/cases/${encodeURIComponent(active.id)}`} aria-label={`Open review: ${active.title}`}>
            Open review<DashboardIcon name="arrow-right" size={13} />
          </Link>
        </> : (
          <p className={styles.inspectorEmpty}>
            {model.total === 0
              ? "No submissions match this view yet."
              : `No submissions in ${statusLabels[selected as CaseStatus]} for this view.`}
          </p>
        )}
      </div>
    </section>
  );
}
