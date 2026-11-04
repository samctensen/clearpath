"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatLabels, productIds, productLabels, statusLabels, type CaseStatus, type ProductId, type DemoRole, type SubmitterView } from "@clearpath/contracts";
import { useDashboard } from "@/lib/use-dashboard";
import { usePendingHeight } from "@/lib/use-pending-height";
import { emptyQueueRecovery, queueReturnScroll, readQueueContext, writeQueueContext, type QueueReturn } from "@/lib/queue-context";
import { dashboardStatuses, dashboardFilterStorageKey, defaultDashboardFilters, firstQueuePage, parseDashboardFilters, type DashboardFilters, type DashboardStatus, type QueuePosition } from "@/lib/dashboard";
import { useDemoRole } from "./workspace";
import { DashboardIcon as Icon } from "./dashboard/dashboard-icon";
import { SubmitterDashboard } from "./submissions/submitter-dashboard";
import { ReviewMap } from "./dashboard/review-map";
import { QueueRowsLoading, ReviewMapLoading, UpNextLoading } from "./dashboard/dashboard-loading";
import { CustomSelect } from "./ui/custom-select";
import { HeaderSearch, PageHeader } from "./ui/page-header";
import { QueueRowActions } from "./dashboard/queue-row-actions";
import { QueueActionDialog, type QueueAction } from "./dashboard/queue-action-dialog";
import actionStyles from "./dashboard/queue-row-actions.module.css";
import styles from "./dashboard/review-dashboard.module.css";

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

function Status({ status, role }: { status: CaseStatus; role: DemoRole }) {
  return <span className={styles.status} data-status={status}><i style={{ background: statusColor[status] }} aria-hidden="true" />{role === "submitter" && status === "ready_for_review" ? "Awaiting review" : statusLabels[status]}</span>;
}

export function ReviewQueue() {
  const role = useDemoRole();
  // Each role restores its own queue context; held requests and dialogs never cross roles.
  return <RoleQueue key={role} role={role} />;
}

function RoleQueue({ role }: { role: DemoRole }) {
  const filtersKey = dashboardFilterStorageKey(role);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>(defaultDashboardFilters);
  const [restored, setRestored] = useState(false);
  const [submitterLayoutReady, setSubmitterLayoutReady] = useState(false);
  const [today, setToday] = useState("");
  const [position, setPosition] = useState<QueuePosition>(firstQueuePage);
  const resource = useDashboard(filters, role, today, restored && Boolean(today), position);
  const pendingReturn = useRef<QueueReturn | null>(null);
  const priorPageStart = useRef<{ positionKey: string; cursor: string | null } | null>(null);
  const positionKey = JSON.stringify(position);
  const queueHeading = useRef<HTMLHeadingElement>(null);
  const [action, setAction] = useState<{ kind: QueueAction; caseId: string; title: string; trigger: HTMLButtonElement | null; role: typeof role } | null>(null);
  const [actionNotice, setActionNotice] = useState("");

  function closeAction() {
    const target = action?.trigger;
    setAction(null);
    if (target?.isConnected) target.focus({ preventScroll: true });
    else queueHeading.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(""), 6000);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  useEffect(() => {
    const saved = readQueueContext(role);
    if (saved) {
      setFilters(saved.filters);
      setPosition(saved.position);
      setSelectedId(saved.selectedId);
      pendingReturn.current = saved.returnTo;
      priorPageStart.current = { positionKey: JSON.stringify(saved.position), cursor: saved.pageStartCursor };
    } else {
      try { setFilters(parseDashboardFilters(JSON.parse(sessionStorage.getItem(filtersKey) ?? "null"), role)); } catch { /* Storage is optional. */ }
    }
    setRestored(true);
    const now = new Date();
    setToday(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`);
    document.title = role === "reviewer" ? "Review desk" : "Submissions";
  }, [filtersKey, role]);
  useEffect(() => {
    if (restored) {
      try { sessionStorage.setItem(filtersKey, JSON.stringify(filters)); } catch { /* Browsing still works without storage. */ }
    }
  }, [filters, restored, filtersKey]);

  // Any change to the query invalidates the cursor, so every filter change returns to page one.
  const update = (patch: Partial<DashboardFilters>) => {
    pendingReturn.current = null;
    setFilters(current => ({ ...current, ...patch }));
    setPosition(firstQueuePage);
  };
  const resetFilters = () => {
    pendingReturn.current = null;
    setFilters({ ...defaultDashboardFilters });
    setPosition(firstQueuePage);
  };
  const cohort = resource.cohort;
  const overview = resource.overview;
  const attention = resource.attention ?? [];
  const rows = resource.rows ?? [];
  const page = resource.page;
  const workspaceTotal = resource.workspaceTotal ?? 0;
  const actionableCount = overview ? overview.counts[role === "reviewer" ? "ready_for_review" : "changes_requested"] + overview.counts.needs_information : 0;
  const scoped = filters.product !== "all" || filters.search.trim() !== "";
  const loading = resource.loading;
  const failed = !loading && Boolean(resource.error);
  const overviewLoading = !overview && !failed;
  const overviewLayout = usePendingHeight<HTMLDivElement>(overviewLoading);
  const resultsLayout = usePendingHeight<HTMLDivElement>(loading);
  const viewsLayout = usePendingHeight<HTMLDivElement>(loading);
  const footerLayout = usePendingHeight<HTMLElement>(loading);
  const scopeNoteLayout = usePendingHeight<HTMLDivElement>(loading);
  const toggleSort = () => update({ sort: filters.sort === "asc" ? "desc" : "asc" });
  useEffect(() => {
    if (!cohort) return;
    setSelectedId(current => current && cohort.some(item => item.id === current)
      ? current : attention[0]?.id ?? rows[0]?.id ?? null);
  }, [cohort, attention, rows]);
  const currentSelection = cohort
    ? selectedId && cohort.some(item => item.id === selectedId) ? selectedId : attention[0]?.id ?? rows[0]?.id ?? null
    : null;
  const pageStartCursor = page.startCursor ?? (priorPageStart.current?.positionKey === positionKey ? priorPageStart.current.cursor : null);
  const emptyPage = !loading && !failed && rows.length === 0 && Boolean(position.after || position.before);
  const recoveryPosition = emptyQueueRecovery(position, pageStartCursor);

  // Restore only this queue return, once the refreshed rows have their final layout.
  // A stable row anchor also handles changed panel heights and narrower viewports.
  useLayoutEffect(() => {
    if (loading || failed || (role === "submitter" && !submitterLayoutReady) || !pendingReturn.current) return;
    const saved = pendingReturn.current;
    pendingReturn.current = null;
    const anchor = saved.anchorId ? document.querySelector<HTMLElement>(`[data-queue-case-id="${CSS.escape(saved.anchorId)}"]`) : null;
    window.scrollTo({ top: queueReturnScroll(saved, anchor ? window.scrollY + anchor.getBoundingClientRect().top : undefined), behavior: "instant" });
    anchor?.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
  }, [loading, failed, role, submitterLayoutReady]);

  useEffect(() => {
    if (!restored || loading || failed) return;
    priorPageStart.current = { positionKey, cursor: pageStartCursor };
    writeQueueContext({ version: 1, role, filters, position, pageStartCursor, selectedId: currentSelection, openedCaseId: null, returnTo: pendingReturn.current });
  }, [restored, loading, failed, role, filters, position, positionKey, pageStartCursor, currentSelection, submitterLayoutReady]);

  function rememberCase(event: MouseEvent<HTMLDivElement>) {
    if (loading || failed || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link || link.target === "_blank") return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/^\/cases\/[^/]+$/.test(url.pathname)) return;
    const caseId = decodeURIComponent(url.pathname.slice("/cases/".length));
    const anchor = document.querySelector<HTMLElement>(`[data-queue-case-id="${CSS.escape(caseId)}"]`);
    writeQueueContext({ version: 1, role, filters, position, pageStartCursor, selectedId: currentSelection, openedCaseId: caseId,
      returnTo: { scrollY: window.scrollY, anchorId: anchor ? caseId : null, anchorTop: anchor?.getBoundingClientRect().top ?? 0 } });
  }

  const viewTabs: { value: SubmitterView; label: string; count: number | undefined }[] = [
    { value: "all", label: "All", count: overview?.total },
    { value: "needs_attention", label: "Needs attention", count: overview ? overview.counts.changes_requested + overview.counts.needs_information : undefined },
    { value: "awaiting_review", label: "Awaiting review", count: overview?.counts.ready_for_review },
    { value: "approved", label: "Copy approved", count: overview?.counts.approved },
  ];
  function previewJourney(id: string) {
    setSelectedId(id);
    requestAnimationFrame(() => {
      const journey = document.getElementById("submission-journey");
      journey?.focus({ preventScroll: true });
      journey?.scrollIntoView({ block: window.matchMedia("(max-width: 900px)").matches ? "start" : "nearest", behavior: "auto" });
    });
  }
  function showAttention() {
    update({ view: "needs_attention", status: "all" });
    queueHeading.current?.focus({ preventScroll: true });
    queueHeading.current?.scrollIntoView({ block: "start" });
  }

  return <div className={styles.dashboard} onClickCapture={rememberCase}>
    <PageHeader title={role === "reviewer" ? "Review desk" : "Submissions"} actions={<>
      <HeaderSearch label="Search campaigns or publishers" placeholder="Search campaigns or publishers" maxLength={200} value={filters.search} onChange={search => update({ search })} />
      <CustomSelect className={styles.product} label="Filter by product" value={filters.product} options={productOptions} onChange={product => update({ product: product as ProductId | "all" })} />
      <Link href="/new" className={role === "submitter" ? styles.primary : styles.secondary}><Icon name="plus" size={14} />New submission</Link>
      {role === "reviewer" && (overview?.actionable[0] ? <Link href={`/cases/${encodeURIComponent(overview.actionable[0].id)}`} className={styles.primary}>Open next review<Icon name="arrow-right" size={14} /></Link> : overviewLoading && resource.hadReviewAction ? <button type="button" className={styles.primary} disabled>Open next review<Icon name="arrow-right" size={14} /></button> : null)}
    </>} />

    {failed && <div className={styles.error} role="alert"><Icon name="circle-exclamation" size={22} /><div><h2>Couldn’t load submissions</h2><p>{resource.error}</p></div><button type="button" onClick={resource.reload} className={styles.secondary}>Try again</button></div>}
      {role === "submitter" ? <SubmitterDashboard
        attention={attention} attentionTotal={actionableCount} selectedId={currentSelection}
        refreshGeneration={resource.refreshGeneration} loading={overviewLoading}
        error={failed ? resource.error : null} onSelect={previewJourney} onLayoutReady={setSubmitterLayoutReady}
        onViewAttention={showAttention} onRetry={resource.reload}
      /> : <div className={styles.overviewGrid} {...overviewLayout}>
        {!cohort ? <ReviewMapLoading unavailable={failed} selected={filters.status} onSelect={status => update({ status: filters.status === status ? "all" : status })} /> : <ReviewMap cases={cohort} preferredCaseId={overview?.actionable[0]?.id} selected={filters.status} onSelect={status => update({ status: filters.status === status ? "all" : status })} />}
        <section className={styles.nextPanel} aria-labelledby="next-title" aria-busy={overviewLoading}>
          <div className={styles.panelHeading}><div><h2 id="next-title">Up next</h2><p>{role === "reviewer" ? "Review or clarify, by target date" : "Revise or clarify, by target date"}</p></div></div>
          <div className={styles.nextList}>
            {overviewLoading ? <UpNextLoading /> : !overview ? <div className={styles.nextEmpty}><p>Your next submissions will appear when the queue loads.</p></div> : overview.actionable.length ? overview.actionable.map((item) => <Link href={`/cases/${encodeURIComponent(item.id)}`} className={styles.nextItem} key={item.id}>
              <div><strong>{item.title}</strong><span><i style={{ background: statusColor[item.status] }} aria-hidden="true" />{item.status === "needs_information" ? "Clarify details" : role === "reviewer" ? "Review copy" : "Revise copy"}<span className={styles.nextDate}>{targetLabel(item.launchDate)}</span></span></div><Icon name="chevron-right" size={12} />
            </Link>) : <div className={styles.nextEmpty}><Icon name="circle-check" size={25} /><p>No {role === "reviewer" ? "reviews or information requests" : "revisions or information requests"} in this view.</p></div>}
          </div>
          {overview && actionableCount > overview.actionable.length && <div className={styles.nextFooter}><span>Showing {overview.actionable.length} of {actionableCount}</span><Link href="#submissions" onClick={() => update({ status: "all" })}>View queue</Link></div>}
          {overview && overview.overdueCount > 0 && <p className={styles.overdueNote}>{overview.overdueCount} open {overview.overdueCount === 1 ? "submission past its target" : "submissions past their targets"}</p>}
        </section>
      </div>}
      <div {...scopeNoteLayout} style={{ display: "flow-root", ...scopeNoteLayout.style }}>
        {scoped && <p className={styles.cohortNote}>{role === "submitter" ? "Attention, journey and list" : "Chart and queue"} reflect your search and product filters.</p>}
      </div>

      <section id="submissions" className={styles.queue} aria-labelledby="queue-title" aria-busy={loading}>
        <div className={styles.queueHeading}><div className={styles.queueTitle}><Icon name="list-check" size={17} /><h2 id="queue-title" ref={queueHeading} tabIndex={-1}>{role === "reviewer" ? "Review queue" : "Workspace submissions"}</h2>{!loading && !failed && <span>{page.total}</span>}</div><div className={styles.queueControls}>
          {role === "reviewer" && <CustomSelect className={styles.statusFilter} label="Filter queue by status" value={filters.status} options={statusOptions} onChange={status => update({ status: status as DashboardStatus })} />}
          <button type="button" className={styles.sortButton} onClick={toggleSort} aria-label={filters.sort === "asc" ? "Sort latest target first" : "Sort earliest target first"}><Icon name={filters.sort === "asc" ? "arrow-up" : "arrow-down"} size={12} />Target date</button>
        </div></div>
        {role === "submitter" && <div className={styles.submissionViews} {...viewsLayout}>
          <div className={styles.viewTabs} role="group" aria-label="Filter submissions">
            {viewTabs.map(tab => <button key={tab.value} type="button" aria-pressed={filters.view === tab.value} onClick={() => update({ view: tab.value, status: "all" })}>{tab.label}{tab.count !== undefined && <span>{tab.count}</span>}</button>)}
          </div><p>Filters the list below</p>
        </div>}
        {loading && <p className="sr-only" role="status">Loading submissions</p>}
        <div {...resultsLayout}>
        {loading || rows.length ? <div className={styles.tableWrap}><table className={styles.table}>
          <thead><tr><th scope="col">Campaign / publisher</th><th scope="col">Product / format</th><th scope="col">{role === "reviewer" ? "Copy checks" : "Next step"}</th><th scope="col" aria-sort={filters.sort === "asc" ? "ascending" : "descending"}><span className={styles.mobileDateLabel}>Target date</span><button type="button" onClick={toggleSort}>Target date<Icon name={filters.sort === "asc" ? "arrow-up" : "arrow-down"} size={10} /></button></th><th scope="col">Status</th><th scope="col" className={styles.rowActions}><span className="sr-only">Actions</span></th></tr></thead>
          {loading ? <QueueRowsLoading /> : <tbody>{rows.map(item => <tr key={item.id} data-queue-case-id={item.id} className={styles.queueRow}>
            <td><Link href={`/cases/${encodeURIComponent(item.id)}`} className={styles.campaign}><span className={styles.fileMark}><Icon name="file-lines" size={17} /></span><span><strong>{item.title}</strong><small>{item.publisher}<span>·</span>Rev {item.revision}</small></span></Link></td>
            <td data-label="Product"><span className={styles.productName}>{productLabels[item.productId]}</span><small>{formatLabels[item.format]}</small></td>
            {role === "reviewer" ? <td data-label="Copy checks"><div className={styles.checks}>{item.findings > 0 ? <span className={styles.finding}><Icon name="circle-exclamation" size={12} />{item.findings} {item.findings === 1 ? "finding" : "findings"}</span> : <span>0 findings</span>}{item.unknowns > 0 && <small>{item.unknowns} unable to evaluate</small>}</div></td> : <td data-label="Next step" className={styles.nextStep}>
              <span>{item.status === "changes_requested" ? "Revise copy" : item.status === "needs_information" ? "Add information" : item.status === "ready_for_review" ? "Awaiting human review" : "View approved revision"}</span>
              <small>{item.guidance?.kind === "awaiting_review" ? <>Revision {item.guidance.revision} submitted {targetLabel(item.guidance.recordedAt.slice(0, 10))}</> : item.guidance?.kind === "reviewer_feedback" ? <>Reviewer feedback on revision {item.guidance.revision}</> : item.guidance?.kind === "missing_information" ? "Automated check needs context" : item.guidance?.kind === "approved_copy" ? <>Approval applies to revision {item.guidance.revision}</> : "Open submission for details"}</small>
            </td>}
            <td data-label="Target date" className={styles.date}>{targetLabel(item.launchDate)}</td>
            <td data-label="Status"><Status status={item.status} role={role} /></td>
            <td className={styles.rowActions}><QueueRowActions caseId={item.id} title={item.title} status={item.status} role={role} onPreview={role === "submitter" ? () => previewJourney(item.id) : undefined} onAction={(kind, trigger) => { setActionNotice(""); setAction({ kind, caseId: item.id, title: item.title, trigger, role }); }} /></td>
          </tr>)}</tbody>}
        </table></div> : failed ? <div className={styles.empty}><Icon name="circle-exclamation" size={24} /><h3>Submissions are unavailable</h3><p>Try loading again to see the queue. Your filters are saved.</p></div> : emptyPage ? <div className={styles.empty}><Icon name="list-check" size={24} /><h3>This queue page changed</h3><p>No submissions remain on this page. Your filters are unchanged.</p><button type="button" className={styles.secondary} onClick={() => setPosition(recoveryPosition)}>{recoveryPosition.before ? "Previous page" : "Return to first page"}<Icon name="arrow-left" size={13} /></button></div> : <div className={styles.empty}><Icon name={workspaceTotal ? "magnifying-glass" : "file-lines"} size={27} /><h3>{workspaceTotal ? "No matching submissions" : "Your next campaign starts here"}</h3><p>{workspaceTotal ? "Try another search, product, or review status." : "Add marketing copy to run checks and start a review."}</p>{workspaceTotal ? <button type="button" className={styles.secondary} onClick={resetFilters}>Clear filters</button> : <Link href="/new" className={styles.secondary}>Start a submission<Icon name="arrow-right" size={13} /></Link>}</div>}
        </div>
        <footer className={styles.queueFooter} {...footerLayout}>
          <span role="status">{loading ? "Loading submissions…" : failed ? "Queue unavailable" : page.total === 0 ? "No submissions in this view" : emptyPage ? `No submissions on this page · ${page.total} in this view` : <>Showing {page.from}–{page.to} of {page.total} {scoped ? "matching " : ""}submissions{scoped && ` · ${workspaceTotal} in workspace`}</>}</span>
          {!failed && !emptyPage && (page.hasPrev || page.hasNext || (loading && resource.hadPagination)) && <div className={styles.pager}>
            <button type="button" className={styles.pagerStep} aria-label="Previous page" disabled={!page.hasPrev || loading} onClick={() => setPosition({ after: null, before: page.startCursor })}><Icon name="arrow-left" size={12} /></button>
            <button type="button" className={styles.pagerStep} aria-label="Next page" disabled={!page.hasNext || loading} onClick={() => setPosition({ after: page.endCursor, before: null })}><Icon name="arrow-right" size={12} /></button>
          </div>}
          {(scoped || filters.status !== "all" || filters.view !== "all") && <button type="button" onClick={resetFilters}>Reset filters</button>}
          <span className={styles.checkNote}>{role === "reviewer" ? "Copy checks are automated findings, not all review concerns." : "Showing the shared demo workspace."}</span>
        </footer>
      </section>
      {action && <QueueActionDialog key={`${action.caseId}:${action.kind}`} caseId={action.caseId} title={action.title} action={action.kind} role={action.role} currentRole={role} onClose={closeAction} onSuccess={message => {
        setAction(null);
        setActionNotice(message);
        queueHeading.current?.focus({ preventScroll: true });
        resource.reload();
      }} />}
      <div className={actionNotice ? actionStyles.notice : "sr-only"} role="status" aria-atomic="true">{actionNotice}</div>
      <footer className={styles.disclaimer}><Icon name="shield-check" size={14} /><p>Copy approval applies to one revision and does not clear an asset for publication.</p><span>Fictional demo</span></footer>
  </div>;
}
