"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Link from "next/link";
import { formatLabels, productLabels, type CaseDetail, type DecisionRecord } from "@clearpath/contracts";
import { useResource } from "@/lib/use-resource";
import { decisionReviewEvents, hasDecisionFeedback } from "@/lib/reference-pages";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import { CustomSelect } from "./ui/custom-select";
import { HeaderSearch, PageHeader } from "./ui/page-header";
import { CaseStatusBadge, CheckBadge, ErrorMessage, buttonClass, formatTime } from "./ui";
import { ReferenceLoading } from "./policy-guide";
import { styles } from "./workspace-reference";

type Outcome = "all" | DecisionRecord["decision"];
const tabs: { value: Outcome; label: string }[] = [{ value: "all", label: "All decisions" }, { value: "approve", label: "Copy approved" }, { value: "request_changes", label: "Changes requested" }];

export function DecisionLog() {
  const { data, loading, error, reload } = useResource<DecisionRecord[]>("/decisions");
  const [query, setQuery] = useState("");
  const [product, setProduct] = useState("all");
  const [outcome, setOutcome] = useState<Outcome>("all");
  const [selectedId, setSelectedId] = useState("");
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const readHash = () => {
      setSelectedId(window.location.hash.slice(1));
      setQuery(""); setProduct("all"); setOutcome("all");
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    return () => { window.removeEventListener("hashchange", readHash); window.removeEventListener("popstate", readHash); };
  }, []);

  function clearSelection() {
    setSelectedId("");
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", url);
  }

  function selectRecord(event: MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.hash = id;
    if (window.location.hash !== url.hash) window.history.pushState(null, "", url);
    if (id === selectedId && window.matchMedia("(max-width: 1100px)").matches) {
      detailHeading.current?.focus({ preventScroll: true });
      detailHeading.current?.scrollIntoView({ block: "start" });
    }
  }

  const cohort = data?.filter((record) => (product === "all" || record.productId === product) &&
    `${record.title} ${record.publisher} ${record.feedback} ${record.policyVersion} ${record.offerVersion ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())) ?? [];
  const records = cohort.filter((record) => outcome === "all" || record.decision === outcome);
  const selected = selectedId ? records.find((record) => record.id === selectedId) : records[0];

  useEffect(() => {
    if (selectedId && selected?.id === selectedId && window.matchMedia("(max-width: 1100px)").matches) {
      detailHeading.current?.focus({ preventScroll: true });
      detailHeading.current?.scrollIntoView({ block: "start" });
    }
  }, [selectedId, selected?.id]);

  return <div className={styles.page}>
    <PageHeader title="Decision log" actions={<>
      <HeaderSearch label="Search decisions" placeholder="Search campaigns, publishers, or feedback" value={query} onChange={(value) => { clearSelection(); setQuery(value); }} />
      <CustomSelect label="Filter decisions by product" value={product} onChange={(value) => { clearSelection(); setProduct(value); }} options={[{ value: "all", label: "All products" }, ...Object.entries(productLabels).map(([value, label]) => ({ value, label }))]} />
    </>} />
    <div className={styles.outcomeTabs} role="group" aria-label="Filter by decision outcome">{tabs.map((tab) => <button key={tab.value} type="button" aria-pressed={outcome === tab.value} onClick={() => { clearSelection(); setOutcome(tab.value); }}>{tab.label}{data && <span>{cohort.filter((record) => tab.value === "all" || record.decision === tab.value).length}</span>}</button>)}</div>
    {error && <ErrorMessage message={error} retry={reload} />}
    {loading && !data && <ReferenceLoading label="Loading decisions" />}
    {data && records.length === 0 && <div className={styles.empty}><DashboardIcon name={data.length ? "magnifying-glass" : "scroll"} size={28} /><h2>{data.length ? "No decisions match these filters" : "Your decisions will be recorded here"}</h2><p>{data.length ? "Try another search or include all review outcomes." : "Approve copy or request changes from a submission to start its decision history."}</p>{data.length ? <button className={buttonClass({ variant: "secondary" })} onClick={() => { clearSelection(); setQuery(""); setProduct("all"); setOutcome("all"); }}>Clear filters</button> : <Link className={buttonClass({ variant: "primary" })} href="/">Open review desk</Link>}</div>}
    {data && records.length > 0 && <div className={styles.logLayout} aria-busy={loading}>
      <section aria-labelledby="decision-list-title" className={styles.records}>
        <div className={styles.sectionHeading}><h2 id="decision-list-title" ref={listHeading} tabIndex={-1}>Decisions, newest first</h2><button type="button" className={styles.refresh} onClick={reload} disabled={loading}><DashboardIcon name="rotate-right" size={12} />Refresh</button></div>
        <ul className={styles.recordList}>{records.map((record) => <li key={record.id}><a href={`#${record.id}`} className={styles.record} aria-current={record.id === selected?.id ? "true" : undefined} data-historical={record.revision < record.currentRevision} onClick={(event) => selectRecord(event, record.id)}>
          <span className={styles.recordTop}><strong>{record.title}</strong><span className={styles.revision}>Rev. {record.revision}</span></span>
          <span className={styles.recordMeta}><CaseStatusBadge status={record.decision === "approve" ? "approved" : "changes_requested"} /><span>{record.publisher}</span></span>
          {hasDecisionFeedback(record.feedback) && <span className={styles.recordFeedback}>{record.feedback}</span>}
          <span className={styles.recordBottom}><time dateTime={record.createdAt}>{formatTime(record.createdAt)}</time>{record.caseDeleted ? <strong>Archived submission</strong> : record.revision < record.currentRevision && <strong>Earlier revision (current: {record.currentRevision})</strong>}</span>
        </a></li>)}</ul>
      </section>
      <aside className={styles.decisionDetail} aria-labelledby="decision-detail-title">
        <div className={styles.detailHeading}><h2 id="decision-detail-title" ref={detailHeading} tabIndex={-1}>Decision record{selected && <span>Revision {selected.revision}</span>}</h2><button type="button" className={styles.backToList} onClick={() => { listHeading.current?.focus({ preventScroll: true }); listHeading.current?.scrollIntoView({ block: "start" }); }}><DashboardIcon name="arrow-left" size={12} />Back to list</button></div>
        {selected ? <DecisionDetail key={`${selected.id}-${selected.currentRevision}`} record={selected} /> : <div className={styles.empty}><h3>Decision unavailable</h3><p>This link does not match a decision in this demo workspace. Choose a record from the list.</p></div>}
      </aside>
    </div>}
    <p className={styles.footerNote}>Decisions remain attached to the reviewed revision. Copy approval does not clear an asset for publication.</p>
  </div>;
}

function DecisionDetail({ record }: { record: DecisionRecord }) {
  return record.caseDeleted ? <DecisionContent record={record} /> : <ActiveDecisionDetail record={record} />;
}

function ActiveDecisionDetail({ record }: { record: DecisionRecord }) {
  const resource = useResource<CaseDetail>(`/cases/${encodeURIComponent(record.caseId)}`);
  return <DecisionContent record={record} resource={resource} />;
}

function DecisionContent({ record, resource }: {
  record: DecisionRecord;
  resource?: { data: CaseDetail | null; loading: boolean; error: string; reload: () => void };
}) {
  const { data, loading, error, reload } = resource ?? {};
  const [copyState, setCopyState] = useState("");
  const revision = data?.revisions.find((revision) => revision.number === record.revision);
  const currentRevision = data?.case.revision ?? record.currentRevision;
  const historical = record.revision < currentRevision;
  const reviewEvents = data ? decisionReviewEvents(data.events, record) : [];

  async function copyLink() {
    const url = new URL("/decisions", window.location.origin);
    url.hash = record.id;
    try { await navigator.clipboard.writeText(url.href); setCopyState("Link copied"); }
    catch { setCopyState("Could not copy. Select this record and copy the address from your browser."); }
  }

  return <>
    <div className={styles.decisionSummary}>
      <CaseStatusBadge status={record.decision === "approve" ? "approved" : "changes_requested"} /><h3>{record.title}</h3><p>{record.publisher}</p>
      {record.caseDeleted ? <div className={styles.historical}><DashboardIcon name="file-lines" size={15} /><span><strong>Archived submission</strong>This submission was deleted from the active queue. Its decision, feedback, and version references are retained here.</span></div> : historical && <div className={styles.historical}><DashboardIcon name="code-branch" size={15} /><span><strong>Earlier revision</strong>This decision covers revision {record.revision}. The current case is on revision {currentRevision}.</span></div>}
      <dl className={styles.recordFacts}><div><dt>Recorded by</dt><dd>{record.actor === "reviewer" ? "Demo reviewer" : record.actor}</dd></div><div><dt>Decision date</dt><dd><time dateTime={record.createdAt}>{formatTime(record.createdAt)}</time></dd></div><div><dt>Policy version</dt><dd>{record.policyVersion}</dd></div><div><dt>Offer version</dt><dd>{record.offerVersion ?? "No matching offer"}</dd></div></dl>
    </div>
    {hasDecisionFeedback(record.feedback) && <section className={styles.feedback}><h3>Reviewer feedback</h3><p>{record.feedback}</p></section>}
    {loading && <ReferenceLoading label="Loading the reviewed revision" />}
    {error && <ErrorMessage message={error} retry={reload} />}
    {revision && <>
      <section className={styles.snapshot}><div className={styles.sectionHeading}><h3>Reviewed copy</h3><span>{formatLabels[revision.input.format]}</span></div><blockquote>{revision.input.content}</blockquote><span className={styles.snapshotMeta}>{revision.input.completeAsset ? "Complete asset" : "Partial asset"}</span></section>
      <section className={styles.checkDetails}><h3>Checks at this decision</h3><ul>{revision.analysis.checks.map((check) => <li key={check.ruleId}><Link href={`/policies#${encodeURIComponent(check.ruleId)}`}>{check.title}</Link><CheckBadge status={check.status} /></li>)}</ul>
        {reviewEvents.length > 0 && <div className={styles.reviewReasons}><h3>Reviewer actions on revision {record.revision}</h3><ol>{reviewEvents.map((event) => <li key={event.id}><p>{event.message}</p><time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time></li>)}</ol></div>}
        {revision.analysis.checks.some((check) => check.status === "finding" || check.status === "unknown") && <p>These are the automated results before the human decision. Reviewer actions record how concerns were handled.</p>}
      </section>
    </>}
    {data && !revision && <div className={styles.feedback}><p>The reviewed revision could not be found. Open the case to inspect its history.</p></div>}
    <footer className={styles.decisionFooter}>{!record.caseDeleted && <Link className={buttonClass({ variant: "secondary" })} href={`/cases/${encodeURIComponent(record.caseId)}?revision=${record.revision}`}>Open revision {record.revision}<DashboardIcon name="arrow-up-right" size={12} /></Link>}<button type="button" className={buttonClass({ variant: "ghost" })} onClick={copyLink}><DashboardIcon name="link" size={12} />Copy decision link</button>{copyState && <p className={styles.copyStatus} role="status">{copyState}</p>}</footer>
  </>;
}
