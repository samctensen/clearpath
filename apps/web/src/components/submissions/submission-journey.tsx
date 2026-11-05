"use client";

import Link from "next/link";
import { useState } from "react";
import type { CaseDetail } from "@clearpath/contracts";
import { buildSubmissionJourney } from "@/lib/submission-journey";
import { cn, formatTime } from "../ui";
import { defaultEventNodeColor, eventNodeColor, styles } from "./submissions.styles";
import { density } from "./submission-density.styles";

const labels = { submitted: "Submitted", revised: "Revision submitted", changes_requested: "Changes requested", approved: "Copy approved" } as const;

export function SubmissionJourney({ detail, selectedRevision }: { detail: CaseDetail; selectedRevision?: number }) {
  const [expanded, setExpanded] = useState(false);
  const { events } = buildSubmissionJourney(detail);
  const revisions = [...new Set(events.map(event => event.revision))];
  const visibleRevisions = new Set(expanded ? revisions : revisions.slice(-4));
  const visible = events.filter(event => visibleRevisions.has(event.revision));
  return <div className={cn(styles.history, visible.length === 1 && density.singleHistory)}>
    <div className={styles.historyHeading}><h3>Submission journey</h3>{revisions.length > 4 && <button type="button" className={styles.textButton} aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Show recent history" : "Show earlier history"}</button>}</div>
    {visible.length ? <ol className={cn(styles.timeline, visible.length === 1 && density.singleTimeline)}>{visible.map(event => <li className={styles.event} key={event.id} data-event={event.type}>
      <Link className={styles.eventLink} href={`/cases/${encodeURIComponent(detail.case.id)}?revision=${event.revision}`} aria-current={selectedRevision === event.revision ? "step" : undefined}>
        <span className={cn(styles.node, eventNodeColor[event.type] ?? defaultEventNodeColor)} aria-hidden="true" /><span className={styles.eventText}><strong>{labels[event.type as keyof typeof labels]}</strong><span>Revision {event.revision}</span><time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time></span>
      </Link>
    </li>)}</ol> : <p className={styles.muted}>No submission events recorded yet.</p>}
  </div>;
}
