"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatLabels, productLabels, type CaseDetail, type CheckResult, type Revision } from "@clearpath/contracts";
import { api, ApiError, errorMessage, type CatalogData } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { AiReviewPanel } from "./ai-review-panel";
import { OfferTerms } from "./catalog";
import { CheckEvidence } from "./check-evidence";
import { DashboardIcon } from "./dashboard/dashboard-icon";
import { FindingActions, ManualConcerns, ReviewDecision } from "./review-actions";
import { ReviewCoverage } from "./review-coverage";
import { SubmissionForm } from "./submission-form";
import { CaseStatusBadge, ErrorMessage, formatDate, formatTime } from "./ui";
import { CustomSelect } from "./ui/custom-select";
import { PageHeader } from "./ui/page-header";
import { useDemoRole } from "./workspace";
import styles from "./case-review.module.css";

const activityLabels = {
  submitted: "Submitted",
  revised: "Revision submitted",
  finding_reviewed: "Finding reviewed",
  manual_finding: "Manual concern added",
  finding_resolved: "Manual concern resolved",
  changes_requested: "Changes requested",
  approved: "Copy approved",
};

function isConcern(check: CheckResult) {
  return check.status === "finding" || check.status === "unknown";
}

export function CaseReview({ id }: { id: string }) {
  const path = `/cases/${encodeURIComponent(id)}`;
  const resource = useResource<CaseDetail>(path);

  return (
    <div className={styles.casePage}>
      {resource.loading ? <><PageHeader title="Review submission" back={{ href: "/", label: "Review queue" }} /><CaseLoading /></> : resource.data ? (
        <ReviewDesk detail={resource.data} path={path} onChange={resource.replace} onReload={resource.reload} />
      ) : <><PageHeader title="Review submission" back={{ href: "/", label: "Review queue" }} /><ErrorMessage message={resource.error} retry={resource.reload} /></>}
    </div>
  );
}

function ReviewDesk({ detail, path, onChange, onReload }: { detail: CaseDetail; path: string; onChange: (detail: CaseDetail) => void; onReload: () => void }) {
  const role = useDemoRole();
  const [selected, setSelected] = useState<number | null>(null);
  const [comparing, setComparing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<{ message: string; conflict: boolean } | null>(null);
  const [activeExcerpt, setActiveExcerpt] = useState("");
  const mutationInFlight = useRef(false);
  const actionNotice = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const evidenceRef = useRef<HTMLDivElement>(null);
  const passedChecksRef = useRef<HTMLDetailsElement>(null);
  const current = detail.revisions.at(-1)!;
  const revision = detail.revisions.find((item) => item.number === selected) ?? current;
  const previous = detail.revisions[detail.revisions.indexOf(revision) - 1];
  const isCurrent = revision === current;
  const isDecided = detail.case.status === "approved" || detail.case.status === "changes_requested";
  const canReview = role === "reviewer" && isCurrent && !isDecided;
  const feedback = detail.events.findLast((event) => event.type === "changes_requested");
  const decision = detail.events.findLast((event) => event.revision === revision.number && (event.type === "approved" || event.type === "changes_requested"));
  const dispositions = new Map((isCurrent ? detail.dispositions : []).map((item) => [item.ruleId, item]));
  const concerns = revision.analysis.checks.filter(isConcern);
  const findingCount = concerns.filter((check) => check.status === "finding").length;
  const unknownCount = concerns.length - findingCount;
  const concernSummary = [
    findingCount ? `${findingCount} ${findingCount === 1 ? "finding" : "findings"}` : "",
    unknownCount ? `${unknownCount} unable to evaluate` : "",
  ].filter(Boolean).join(" · ") || "0 concerns";
  const openManual = detail.manualFindings.filter((finding) => finding.status === "open").length;
  const unresolved = concerns.filter((check) => dispositions.get(check.ruleId)?.action !== "dismissed").length;
  const canRequest = openManual > 0 || concerns.some((check) => dispositions.get(check.ruleId)?.action === "confirmed");
  const marked = excerptRanges(revision);

  async function mutate(suffix: string, body: object) {
    if (mutationInFlight.current) return false;
    mutationInFlight.current = true;
    setPending(true);
    setActionError(null);
    try {
      const updated = await api<CaseDetail>(`${path}${suffix}`, {
        body: { ...body, expectedRevision: current.number },
        role,
      });
      onChange(updated);
      return true;
    } catch (failure) {
      setActionError({ message: errorMessage(failure), conflict: failure instanceof ApiError && failure.status === 409 });
      actionNotice.current?.scrollIntoView({ block: "nearest" });
      return false;
    } finally {
      mutationInFlight.current = false;
      setPending(false);
    }
  }

  function jumpToExcerpt(ruleId: string) {
    setActiveExcerpt(ruleId);
    const target = copyRef.current?.querySelector<HTMLElement>(`[data-excerpt~="${CSS.escape(ruleId)}"]`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "nearest" });
  }

  function jumpToCheck(ruleId: string) {
    const check = revision.analysis.checks.find((item) => item.ruleId === ruleId);
    if (!check) return;
    if (!isConcern(check) && passedChecksRef.current) passedChecksRef.current.open = true;
    const target = evidenceRef.current?.querySelector<HTMLElement>(`[data-check="${CSS.escape(ruleId)}"]`);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "start" });
  }

  return (
    <>
      <PageHeader
        title={revision.input.title}
        description={revision.input.publisher}
        back={{ href: "/", label: "Review queue" }}
        actions={<>
          {role === "submitter" && isCurrent && !editing && (
            <button type="button" className="button primary" disabled={pending} onClick={() => setEditing(true)}><DashboardIcon name="pen" size={15} />{detail.case.status === "changes_requested" ? "Revise submission" : "Edit copy"}</button>
          )}
          {canReview && !editing && <a href="#decision" className="button secondary">Review decision<DashboardIcon name="arrow-right" size={15} /></a>}
        </>}
      >
        <div className={styles.headingContext}><CaseStatusBadge status={detail.case.status} /><span>Current revision {current.number}</span></div>
      </PageHeader>

      {editing ? (
        <RevisionEditor
          path={path}
          revision={current}
          wasApproved={detail.case.status === "approved"}
          feedback={detail.case.status === "changes_requested" && feedback?.revision === current.number ? feedback.message : undefined}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => {
            onChange(updated);
            setSelected(null);
            setComparing(false);
            setEditing(false);
          }}
        />
      ) : (
        <>
          <section className={styles.context} aria-label="Revision details">
            <dl className={styles.metadata}>
              <div><dt>Product</dt><dd>{productLabels[revision.input.productId]}</dd></div>
              <div><dt>Format</dt><dd>{formatLabels[revision.input.format]}</dd></div>
              <div><dt>Target launch</dt><dd>{formatDate(revision.input.launchDate)}</dd></div>
              <div><dt>Copy provided</dt><dd>{revision.input.completeAsset ? "Complete asset" : "Excerpt only"}</dd></div>
              {revision.input.format === "banner" && <div><dt>Links to an application</dt><dd>{revision.input.linksToApplication === null ? "Unknown" : revision.input.linksToApplication ? "Yes" : "No"}</dd></div>}
            </dl>
            <div className={styles.revisionToolbar}>
              <CustomSelect
                label="Select revision"
                value={String(revision.number)}
                disabled={pending}
                className={styles.revisionSelect}
                options={detail.revisions.slice().reverse().map((item) => ({ value: String(item.number), label: `Revision ${item.number}${item === current ? " (current)" : ""}` }))}
                onChange={(value) => {
                  const number = Number(value);
                  setSelected(number === current.number ? null : number);
                  setComparing(false);
                  setActiveExcerpt("");
                }}
              />
              {previous && <button type="button" className="button secondary small" aria-pressed={comparing} onClick={() => setComparing(!comparing)}><DashboardIcon name="columns-3" size={14} />{comparing ? "Hide comparison" : "Compare with previous"}</button>}
            </div>
          </section>
          {decision && (
            <div role="status" className={`notice ${decision.type === "approved" ? "notice-approved" : "notice-concern"}`}>
              <DashboardIcon name={decision.type === "approved" ? "circle-check" : "file-lines"} size={19} />
              <div><strong>{activityLabels[decision.type]} for revision {revision.number}</strong><p>{decision.message}</p></div>
            </div>
          )}
          {!decision && isCurrent && feedback && role === "submitter" && (
            <div className="notice notice-concern"><DashboardIcon name="file-lines" size={19} /><div><strong>Feedback on revision {feedback.revision}</strong><p>{feedback.message}</p></div></div>
          )}
          {!isCurrent && <div className="notice"><DashboardIcon name="circle-exclamation" size={18} /><div><strong>Viewing revision {revision.number}</strong><p>This revision is read-only. Review actions apply to revision {current.number}.</p></div><button type="button" className={`button secondary small ${styles.returnToCurrent}`} disabled={pending} onClick={() => { setSelected(null); setComparing(false); setActiveExcerpt(""); }}>View current revision</button></div>}
          <div className="action-notice" ref={actionNotice}>
            {actionError && <ErrorMessage message={actionError.message} retry={actionError.conflict ? onReload : undefined} retryLabel="Reload submission" />}
            <div className="sr-only" role="status">{pending ? "Saving review action" : ""}</div>
          </div>

          {comparing && previous && <RevisionComparison current={revision} previous={previous} />}
          <ReviewCoverage analysis={revision.analysis} onShowCheck={jumpToCheck} />
          <div className={styles.reviewWorkspace}>
            <div className={styles.documentColumn}>
              <div className={styles.documentContent} tabIndex={0} role="region" aria-label="Submitted copy and offer reference">
              <section className={styles.document} aria-labelledby="marketing-copy-title">
                <header className={styles.documentHeading}>
                  <div className={styles.sectionHeading}><DashboardIcon name="file-lines" size={18} /><h2 id="marketing-copy-title">Marketing copy</h2></div>
                  <div className={styles.documentMeta}><span>Revision {revision.number}</span><time dateTime={revision.createdAt}>{formatTime(revision.createdAt)}</time></div>
                </header>
                {marked.some((part) => part.rules.length > 0) && <p className={styles.excerptHint}><span aria-hidden="true" />Highlighted copy is linked to evidence in the checks.</p>}
                <div className={styles.copyText} ref={copyRef}>
                  {marked.map((part) => part.rules.length ? (
                    <mark
                      key={part.start}
                      tabIndex={-1}
                      data-excerpt={part.rules.join(" ")}
                      className={part.rules.includes(activeExcerpt) ? styles.activeExcerpt : undefined}
                    >{part.text}</mark>
                  ) : <span key={part.start}>{part.text}</span>)}
                </div>
                {revision.input.substantiation && <div className={styles.supportingCopy}><h3>Supporting evidence</h3><p>{revision.input.substantiation}</p></div>}
                <div className={styles.documentFootnote}><DashboardIcon name="circle-exclamation" size={14} /><p>{revision.input.completeAsset ? "Submitted as the complete asset." : "Only an excerpt was provided."} Copy approval applies to this revision. Visual review is separate.</p></div>
              </section>
              <OfferReference revision={revision} />
              </div>
            </div>
            <div className={styles.evidenceRail} ref={evidenceRef}>
              <section className={styles.checks} aria-labelledby="copy-checks-title">
                <div className={styles.checksHeading}>
                  <div className={styles.sectionHeading}><DashboardIcon name="list-check" size={18} /><h2 id="copy-checks-title">Copy checks</h2></div>
                  <span className={styles.concernCount}>{concernSummary}</span>
                </div>
                <p className={styles.checkScope}>Text-only checks. Visual and legal review are separate.</p>
                <details className={styles.scopeDetails}><summary>Full check scope</summary><p>{revision.analysis.scope}</p></details>
                {concerns.length > 0 && (
                  <div className="check-list" key={revision.id}>
                    {concerns.map((check) => (
                      <div key={check.ruleId} id={`review-check-${encodeURIComponent(check.ruleId)}`} data-check={check.ruleId} className={styles.checkTarget} role="group" aria-label={`${check.title} evidence`} tabIndex={-1}>
                      <CheckEvidence check={check} onShowExcerpt={marked.some((part) => part.rules.includes(check.ruleId)) ? () => jumpToExcerpt(check.ruleId) : undefined}
                        change={previous ? previous.analysis.checks.some((item) => item.ruleId === check.ruleId && isConcern(item)) ? "Also flagged on the previous revision" : "Newly flagged on this revision" : undefined}>
                        <FindingActions ruleId={check.ruleId} confirmationReason={`${check.title}. ${check.suggestion ?? check.explanation}`.slice(0, 4000)} disposition={dispositions.get(check.ruleId)} mutate={canReview ? mutate : undefined} pending={pending} />
                      </CheckEvidence>
                      </div>
                    ))}
                  </div>
                )}
                {concerns.length === 0 && <div className={styles.noConcerns}><DashboardIcon name="circle-check" size={18} /><p>No concerns were flagged by these checks. Human review is still required.</p></div>}
                <details className={styles.coverageDetails} ref={passedChecksRef}>
                  <summary>Passed and not applicable checks <span>{revision.analysis.checks.length - concerns.length}</span></summary>
                  <div className="check-list">
                    {revision.analysis.checks.filter((check) => !isConcern(check)).map((check) => (
                      <div key={check.ruleId} id={`review-check-${encodeURIComponent(check.ruleId)}`} data-check={check.ruleId} className={styles.checkTarget} role="group" aria-label={`${check.title} evidence`} tabIndex={-1}>
                      <CheckEvidence check={check}
                        change={previous?.analysis.checks.some((item) => item.ruleId === check.ruleId && isConcern(item)) ? "Previously flagged, no longer detected" : undefined} />
                      </div>
                    ))}
                  </div>
                </details>
              </section>
              {isCurrent && <div className={styles.manualSection}><ManualConcerns findings={detail.manualFindings} mutate={role === "reviewer" ? mutate : undefined} canAdd={canReview} pending={pending} /></div>}
              {canReview && <div className={styles.decisionSection}><ReviewDecision key={current.id} revision={current.number} unresolved={unresolved} openManual={openManual} canRequest={canRequest} mutate={mutate} pending={pending} /></div>}
            </div>
          </div>
          <div className={styles.advisory}><AiReviewPanel
            key={`${detail.case.id}:${revision.number}`}
            path={path}
            revision={revision}
            isCurrent={isCurrent}
            role={role}
            pending={pending}
            findings={detail.manualFindings}
            onPromote={canReview ? (input) => mutate("/manual-findings", input) : undefined}
            onReload={onReload}
          /></div>
          <ActivityTimeline events={detail.events} />
        </>
      )}
    </>
  );
}

function OfferReference({ revision }: { revision: Revision }) {
  const { offerId } = revision.input;
  const { policyVersion, offerVersion } = revision.analysis;
  return (
    <section className={styles.reference} aria-labelledby="reference-title">
      <div className={styles.sectionHeading}><DashboardIcon name="book-open" size={17} /><h2 id="reference-title">Reference snapshot</h2></div>
      <dl className={styles.referenceVersions}>
        <div><dt>Policy version</dt><dd>{policyVersion}</dd></div>
        <div><dt>Offer version</dt><dd>{offerVersion ?? "Unknown"}</dd></div>
      </dl>
      {offerId && offerVersion && <MatchingOffer offerId={offerId} version={offerVersion} />}
      <Link className="text-link" href={offerId ? `/catalog#${encodeURIComponent(offerId)}` : "/catalog"}>View offer library<DashboardIcon name="arrow-up-right" size={13} /></Link>
    </section>
  );
}

function MatchingOffer({ offerId, version }: { offerId: string; version: string }) {
  const catalog = useResource<CatalogData>("/catalog");
  const offer = catalog.data?.offers.find((item) => item.id === offerId && item.version === version);
  if (catalog.loading) return <p className="muted">Loading offer terms…</p>;
  if (!offer) return <p className="muted">Terms for this offer version are unavailable.</p>;
  return <div className={styles.offerSnapshot}><h3>{offer.name}</h3><OfferTerms offer={offer} /></div>;
}

function RevisionEditor({ path, revision, wasApproved, feedback, onCancel, onSaved }: {
  path: string; revision: Revision; wasApproved: boolean; feedback?: string; onCancel: () => void; onSaved: (detail: CaseDetail) => void;
}) {
  const catalog = useResource<CatalogData>("/catalog");
  const [formReady, setFormReady] = useState(false);
  useEffect(() => {
    if (!catalog.loading) setFormReady(true);
  }, [catalog.loading]);
  return (
    <>
      {wasApproved && <div className="notice"><DashboardIcon name="circle-info" size={18} /><div><strong>Editing approved copy</strong><p>Submitting creates revision {revision.number + 1} and sends it back for review.</p></div></div>}
      {feedback && <div className="notice notice-concern"><DashboardIcon name="scroll" size={19} /><div><strong>Reviewer feedback</strong><p>{feedback}</p></div></div>}
      {!formReady ? <CaseLoading label="Loading revision form" /> : (
        <SubmissionForm
          initial={revision.input}
          catalog={catalog}
          revision={revision.number}
          onCancel={onCancel}
          onSave={(input, role) => api<CaseDetail>(`${path}/revisions`, { body: { expectedRevision: revision.number, input }, role })}
          onSaved={onSaved}
        />
      )}
    </>
  );
}

function ActivityTimeline({ events }: { events: CaseDetail["events"] }) {
  return (
    <section className={styles.activity} aria-labelledby="activity-title">
      <div className={styles.activityHeading}><div className={styles.sectionHeading}><DashboardIcon name="clock" size={17} /><h2 id="activity-title">Activity</h2></div><span>{events.length} recorded {events.length === 1 ? "event" : "events"}</span></div>
      {events.length ? <ol className={styles.timeline}>
        {events.slice().reverse().map((event) => (
          <li key={event.id}><span className={styles.timelineDot} aria-hidden="true" /><div className={styles.activityEvent}><div className={styles.eventHeading}><strong>{activityLabels[event.type]}</strong><time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time></div><p>{event.message}</p><div className={styles.eventMetadata}><span>Revision {event.revision}</span><span>{event.actor}</span></div></div></li>
        ))}
      </ol> : <p className="muted">No activity yet.</p>}
    </section>
  );
}

function RevisionComparison({ current, previous }: { current: Revision; previous: Revision }) {
  const priorConcerns = previous.analysis.checks.filter(isConcern);
  const selectedConcerns = current.analysis.checks.filter(isConcern);
  const newlyFlagged = selectedConcerns.filter((check) => !priorConcerns.some((prior) => prior.ruleId === check.ruleId)).length;
  const noLongerFlagged = priorConcerns.filter((check) => !selectedConcerns.some((selected) => selected.ruleId === check.ruleId)).length;
  return (
    <section className={styles.comparison} aria-labelledby="comparison-title">
      <div className={styles.sectionHeading}><DashboardIcon name="columns-3" size={17} /><h2 id="comparison-title">Revision comparison</h2></div>
      <p>{current.input.content === previous.input.content ? "The submitted text is identical across these revisions." : "Read the previous and selected copy side by side."}</p>
      <p>{newlyFlagged} newly flagged, {selectedConcerns.length - newlyFlagged} still flagged, {noLongerFlagged} no longer flagged by the automated checks.</p>
      <div className={styles.comparisonColumns}>
        {[previous, current].map((version) => (
          <div key={version.id}><h3>Revision {version.number}<span>{version === previous ? "Previous" : "Selected"}</span></h3><div className={styles.comparisonCopy}>{version.input.content}</div></div>
        ))}
      </div>
    </section>
  );
}

function CaseLoading({ label = "Loading submission" }: { label?: string }) {
  return (
    <div className={styles.loading} role="status" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className={styles.loadingContext} aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <span key={index} />)}</div>
      <div className={styles.loadingWorkspace} aria-hidden="true">
        <div className={styles.loadingCopy}><span className={styles.skeletonTitle} />{Array.from({ length: 8 }, (_, index) => <span key={index} />)}</div>
        <div className={styles.loadingEvidence}>{Array.from({ length: 3 }, (_, index) => <div key={index}><span className={styles.skeletonTitle} /><span /><span /></div>)}</div>
      </div>
    </div>
  );
}

function excerptRanges(revision: Revision) {
  const { content } = revision.input;
  const valid = revision.analysis.checks.flatMap(({ excerpt, ruleId }) =>
    excerpt && Number.isInteger(excerpt.start) && Number.isInteger(excerpt.end) && excerpt.start >= 0 && excerpt.end <= content.length
      && excerpt.start < excerpt.end && content.slice(excerpt.start, excerpt.end) === excerpt.text
      ? [{ ...excerpt, ruleId }] : [],
  );
  const boundaries = [...new Set([0, content.length, ...valid.flatMap(({ start, end }) => [start, end])])].sort((a, b) => a - b);
  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1];
    return { start, text: content.slice(start, end), rules: valid.filter((excerpt) => excerpt.start <= start && excerpt.end >= end).map(({ ruleId }) => ruleId) };
  });
}
