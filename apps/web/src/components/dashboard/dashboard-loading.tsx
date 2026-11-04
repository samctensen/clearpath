import { statusLabels, type CaseStatus } from "@clearpath/contracts";
import { dashboardStatuses } from "@/lib/dashboard";
import { DashboardIcon } from "./dashboard-icon";
import styles from "./dashboard-loading.module.css";

export function ReviewMapLoading({ unavailable = false, selected, onSelect }: {
  unavailable?: boolean;
  selected: CaseStatus | "all";
  onSelect: (status: CaseStatus) => void;
}) {
  return <section className={styles.map} aria-labelledby="review-map-title" aria-busy={!unavailable}>
    <header className={styles.heading}><h2 id="review-map-title">Review map</h2><p>Each dot is a submission, grouped by current status.</p></header>
    {unavailable ? <div className={styles.unavailable}><DashboardIcon name="circle-exclamation" size={20} /><p>The review map will return when submissions load.</p></div> : <>
      <div className={styles.graph}>
        <div className={styles.origin} aria-hidden="true"><span className={styles.block} /></div>
        <div className={styles.branches}>
          <svg viewBox="0 0 600 176" preserveAspectRatio="none" aria-hidden="true">
            {[22, 66, 110, 154].map((y, index) => <g key={y}>
              <path className={styles.path} d={`M0 88 H30 C100 88 110 ${y} 200 ${y} H600`} />
              <path className={styles.trace} d={`M0 88 H30 C100 88 110 ${y} 200 ${y} H600`} pathLength="100" style={{ animationDelay: `${index * -.5}s` }} />
            </g>)}
          </svg>
          <div className={styles.destinations}>{dashboardStatuses.map(status => <button type="button" key={status} aria-pressed={selected === status} onClick={() => onSelect(status)}><span>{statusLabels[status]}</span><i className={styles.block} aria-hidden="true" /></button>)}</div>
        </div>
      </div>
      <div className={styles.mapFooter} role="status"><span className={styles.loadingDot} aria-hidden="true" /><span>Gathering submissions for your review map…</span></div>
    </>}
  </section>;
}

export function UpNextLoading() {
  return <div className={styles.next} role="status"><span className="sr-only">Loading next submissions</span>
    {[0, 1, 2].map(index => <div className={styles.nextRow} key={index} aria-hidden="true"><span className={`${styles.block} ${styles.title}`} /><span className={`${styles.block} ${styles.detail}`} /></div>)}
  </div>;
}

export function QueueRowsLoading() {
  return <tbody className={styles.rows} aria-hidden="true">{[0, 1, 2, 3].map(index => <tr key={index}>
    <td><span className={`${styles.block} ${styles.campaign}`} /><span className={`${styles.block} ${styles.publisher}`} /></td>
    <td data-label="Product"><span className={`${styles.block} ${styles.product}`} /><span className={`${styles.block} ${styles.detail}`} /></td>
    <td data-label="Copy checks"><span className={`${styles.block} ${styles.short}`} /></td>
    <td data-label="Target date"><span className={`${styles.block} ${styles.short}`} /></td>
    <td data-label="Status"><span className={`${styles.block} ${styles.pill}`} /></td>
  </tr>)}</tbody>;
}
