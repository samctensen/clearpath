"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatLabels, productIds, productLabels, statusLabels, type CaseStatus, type CaseSummary, type ProductId } from "@clearpath/contracts";
import { useResource } from "@/lib/use-resource";
import { buildDashboard, dashboardCohort, dashboardRows, dashboardStatuses, defaultDashboardFilters, parseDashboardFilters, type DashboardFilters, type DashboardStatus } from "@/lib/dashboard";
import { useChangeDemoRole, useDemoRole } from "./workspace";
import { DashboardIcon as Icon } from "./dashboard/dashboard-icon";
import { DashboardUserMenu } from "./dashboard/dashboard-user-menu";
import { ReviewMap } from "./dashboard/review-map";
import { QueueRowsLoading, ReviewMapLoading, UpNextLoading } from "./dashboard/dashboard-loading";
import { CustomSelect } from "./ui/custom-select";
import styles from "./dashboard/review-dashboard.module.css";

const filtersKey = "clearpath-dashboard-filters-v1";
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const statusColor: Record<CaseStatus, string> = {
  ready_for_review: "var(--dash-ready)", needs_information: "var(--dash-info)",
  changes_requested: "var(--dash-waiting)", approved: "var(--dash-approved)",
};
const productOptions = [{ value: "all", label: "All products" }, ...productIds.map(value => ({ value, label: productLabels[value] }))];
const statusOptions = [{ value: "all", label: "All statuses" }, ...dashboardStatuses.map(value => ({ value, label: statusLabels[value] }))];

function targetLabel(value: string) {
  const date = new Date(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? dateFormat.format(date) : "Date unavailable";
}

function Status({ status }: { status: CaseStatus }) {
  return <span className={styles.status} data-status={status}><i style={{ background: statusColor[status] }} aria-hidden="true" />{statusLabels[status]}</span>;
}

export function ReviewQueue() {
  const role = useDemoRole();
  const changeRole = useChangeDemoRole();
  const resource = useResource<CaseSummary[]>("/cases");
  const [filters, setFilters] = useState<DashboardFilters>(defaultDashboardFilters);
  const [restored, setRestored] = useState(false);
  const [today, setToday] = useState("");

  useEffect(() => {
    try { setFilters(parseDashboardFilters(JSON.parse(sessionStorage.getItem(filtersKey) ?? "null"))); } catch { /* Storage is optional. */ }
    setRestored(true);
    const now = new Date();
    setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
  }, []);
  useEffect(() => {
    if (restored) {
      try { sessionStorage.setItem(filtersKey, JSON.stringify(filters)); } catch { /* Browsing still works without storage. */ }
    }
  }, [filters, restored]);

  const update = (patch: Partial<DashboardFilters>) => setFilters(current => ({ ...current, ...patch }));
  const cases = resource.data ?? [];
  const cohort = dashboardCohort(cases, filters);
  const overview = buildDashboard(cohort, role, today);
  const rows = dashboardRows(cases, filters);
  const actionableCount = overview.counts[role === "reviewer" ? "ready_for_review" : "changes_requested"] + overview.counts.needs_information;
  const scoped = filters.product !== "all" || filters.search.trim() !== "";
  const loading = resource.loading || !restored;
  const failed = !loading && Boolean(resource.error);
  const toggleSort = () => update({ sort: filters.sort === "asc" ? "desc" : "asc" });

  return <div className={styles.dashboard}>
    <header className={styles.toolbar}>
      <h1>Review desk</h1>
      <div className={styles.scopeControls}>
        <label className={styles.search}><Icon name="magnifying-glass" size={15} /><span className="sr-only">Search campaigns or publishers</span><input type="search" placeholder="Search campaigns or publishers" value={filters.search} onChange={event => update({ search: event.target.value })} /></label>
        <CustomSelect className={styles.product} label="Filter by product" value={filters.product} options={productOptions} onChange={product => update({ product: product as ProductId | "all" })} />
        <Link href="/new" className={styles.primary}><Icon name="plus" size={14} />New submission</Link>
      </div>
      <div className={styles.userControl}><DashboardUserMenu role={role} onRoleChange={changeRole} /></div>
    </header>

    {failed && <div className={styles.error} role="alert"><Icon name="circle-exclamation" size={22} /><div><h2>Couldn’t load submissions</h2><p>{resource.error}</p></div><button type="button" onClick={resource.reload} className={styles.secondary}>Try again</button></div>}
      <div className={styles.overviewGrid}>
        {loading || failed ? <ReviewMapLoading unavailable={failed} selected={filters.status} onSelect={status => update({ status: filters.status === status ? "all" : status })} /> : <ReviewMap cases={cohort} preferredCaseId={overview.actionable[0]?.id} selected={filters.status} onSelect={status => update({ status: filters.status === status ? "all" : status })} />}
        <section className={styles.nextPanel} aria-labelledby="next-title" aria-busy={loading}>
          <div className={styles.panelHeading}><div><h2 id="next-title">Up next</h2><p>{role === "reviewer" ? "Review or clarify, by target date" : "Revise or clarify, by target date"}</p></div></div>
          <div className={styles.nextList}>
            {loading ? <UpNextLoading /> : failed ? <div className={styles.nextEmpty}><p>Your next submissions will appear when the queue loads.</p></div> : overview.actionable.length ? overview.actionable.map((item) => <Link href={`/cases/${encodeURIComponent(item.id)}`} className={styles.nextItem} key={item.id}>
              <div><strong>{item.title}</strong><span><i style={{ background: statusColor[item.status] }} aria-hidden="true" />{item.status === "needs_information" ? "Clarify details" : role === "reviewer" ? "Review copy" : "Revise copy"}<span className={styles.nextDate}>{targetLabel(item.launchDate)}</span></span></div><Icon name="chevron-right" size={12} />
            </Link>) : <div className={styles.nextEmpty}><Icon name="circle-check" size={25} /><p>No {role === "reviewer" ? "reviews or information requests" : "revisions or information requests"} in this view.</p></div>}
          </div>
          {!loading && !failed && actionableCount > overview.actionable.length && <div className={styles.nextFooter}><span>Showing {overview.actionable.length} of {actionableCount}</span><Link href="#submissions" onClick={() => update({ status: "all" })}>View queue</Link></div>}
          {!loading && !failed && overview.overdueCount > 0 && <p className={styles.overdueNote}>{overview.overdueCount} open {overview.overdueCount === 1 ? "submission past its target" : "submissions past their targets"}</p>}
        </section>
      </div>
      {scoped && <p className={styles.cohortNote}>Chart and queue reflect your search and product filters.</p>}

      <section id="submissions" className={styles.queue} aria-labelledby="queue-title" aria-busy={loading}>
        <div className={styles.queueHeading}><div className={styles.queueTitle}><Icon name="list-check" size={17} /><h2 id="queue-title">{role === "reviewer" ? "Review queue" : "Your submissions"}</h2>{!loading && !failed && <span>{rows.length}</span>}</div><div className={styles.queueControls}>
          <CustomSelect className={styles.statusFilter} label="Filter queue by status" value={filters.status} options={statusOptions} onChange={status => update({ status: status as DashboardStatus })} />
          <button type="button" className={styles.sortButton} onClick={toggleSort} aria-label={filters.sort === "asc" ? "Sort latest target first" : "Sort earliest target first"}><Icon name={filters.sort === "asc" ? "arrow-up" : "arrow-down"} size={12} />Target date</button>
        </div></div>
        {loading && <p className="sr-only" role="status">Loading submissions</p>}
        {loading || rows.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">Campaign / publisher</th><th scope="col">Product / format</th><th scope="col">Copy checks</th><th scope="col" aria-sort={filters.sort === "asc" ? "ascending" : "descending"}><span className={styles.mobileDateLabel}>Target date</span><button type="button" onClick={toggleSort}>Target date<Icon name={filters.sort === "asc" ? "arrow-up" : "arrow-down"} size={10} /></button></th><th scope="col">Status</th></tr></thead>
          {loading ? <QueueRowsLoading /> : <tbody>{rows.map(item => <tr key={item.id}>
            <td><Link href={`/cases/${encodeURIComponent(item.id)}`} className={styles.campaign}><span className={styles.fileMark}><Icon name="file-lines" size={17} /></span><span><strong>{item.title}</strong><small>{item.publisher}<span>·</span>Rev {item.revision}</small></span><Icon name="arrow-up-right" size={13} className={styles.rowArrow} /></Link></td>
            <td data-label="Product"><span className={styles.productName}>{productLabels[item.productId]}</span><small>{formatLabels[item.format]}</small></td>
            <td data-label="Copy checks"><div className={styles.checks}>{item.findings > 0 ? <span className={styles.finding}><Icon name="circle-exclamation" size={12} />{item.findings} {item.findings === 1 ? "finding" : "findings"}</span> : <span>0 findings</span>}{item.unknowns > 0 && <small>{item.unknowns} unknown</small>}</div></td>
            <td data-label="Target date" className={styles.date}>{targetLabel(item.launchDate)}</td>
            <td data-label="Status"><Status status={item.status} /></td>
          </tr>)}</tbody>}
        </table></div> : failed ? <div className={styles.empty}><Icon name="circle-exclamation" size={24} /><h3>Submissions are unavailable</h3><p>Try loading again to see the queue. Your filters are saved.</p></div> : <div className={styles.empty}><Icon name={cases.length ? "magnifying-glass" : "file-lines"} size={27} /><h3>{cases.length ? "No matching submissions" : "Your next campaign starts here"}</h3><p>{cases.length ? "Try another search, product, or review status." : "Add marketing copy to run checks and start a review."}</p>{cases.length ? <button type="button" className={styles.secondary} onClick={() => setFilters({ ...defaultDashboardFilters })}>Clear filters</button> : <Link href="/new" className={styles.secondary}>Start a submission<Icon name="arrow-right" size={13} /></Link>}</div>}
        <footer className={styles.queueFooter}><span>{loading ? "Loading submissions…" : failed ? "Queue unavailable" : <>Showing {rows.length} of {cohort.length} {scoped ? "matching " : ""}submissions{scoped && ` · ${cases.length} in workspace`}</>}</span>{(scoped || filters.status !== "all") && <button type="button" onClick={() => setFilters({ ...defaultDashboardFilters })}>Reset filters</button>}<span className={styles.checkNote}>Copy checks are automated findings, not all review concerns.</span></footer>
      </section>
      <footer className={styles.disclaimer}><Icon name="shield-check" size={14} /><p>Copy approval applies to one revision and does not clear an asset for publication.</p><span>Fictional demo</span></footer>
  </div>;
}
