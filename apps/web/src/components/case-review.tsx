"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Columns2, FileText, GitBranch, Info, Pencil, ScrollText } from "lucide-react";
import { formatLabels, productLabels, type CaseDetail, type CheckResult, type Revision } from "@clearpath/contracts";
import { api, ApiError, errorMessage, type CatalogData } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { AiReviewPanel } from "./ai-review-panel";
import { OfferTerms } from "./catalog";
import { AnalysisSummary, CheckEvidence } from "./check-evidence";
import { FindingActions, ManualConcerns, ReviewDecision } from "./review-actions";
import { SubmissionForm } from "./submission-form";
import { CaseStatusBadge, ErrorMessage, formatDate, formatTime, Loading } from "./ui";
import { useDemoRole } from "./workspace";

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
    <>
      <Link href="/" className="back-link"><ArrowLeft size={16} aria-hidden="true" />Review queue</Link>
      {resource.loading ? <Loading label="Loading submission" /> : resource.data ? (
        <ReviewDesk detail={resource.data} path={path} onChange={resource.replace} onReload={resource.reload} />
      ) : <ErrorMessage message={resource.error} retry={resource.reload} />}
    </>
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

  return (
    <>
      <div className="page-heading case-heading">
        <div>
          <div className="heading-context"><CaseStatusBadge status={detail.case.status} /><span>Current revision {current.number}</span></div>
          <h1>{revision.input.title}</h1>
          <p>{revision.input.publisher}</p>
        </div>
        {role === "submitter" && isCurrent && !editing && (
          <button type="button" className="button primary" disabled={pending} onClick={() => setEditing(true)}><Pencil size={16} aria-hidden="true" />{detail.case.status === "changes_requested" ? "Revise submission" : "Edit copy"}</button>
        )}
        {canReview && !editing && <a href="#decision" className="button secondary">Review decision<ArrowRight size={16} aria-hidden="true" /></a>}
      </div>

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
          <section className="panel case-context" aria-label="Revision details">
            <dl>
              <div><dt>Product</dt><dd>{productLabels[revision.input.productId]}</dd></div>
              <div><dt>Format</dt><dd>{formatLabels[revision.input.format]}</dd></div>
              <div><dt>Target launch</dt><dd>{formatDate(revision.input.launchDate)}</dd></div>
              <div><dt>Copy provided</dt><dd>{revision.input.completeAsset ? "Complete asset" : "Excerpt only"}</dd></div>
              {revision.input.format === "banner" && <div><dt>Links to an application</dt><dd>{revision.input.linksToApplication === null ? "Unknown" : revision.input.linksToApplication ? "Yes" : "No"}</dd></div>}
            </dl>
            <div className="revision-toolbar">
              <label><GitBranch size={17} aria-hidden="true" /><span className="sr-only">Select revision</span>
                <select aria-label="Select revision" value={revision.number} disabled={pending} onChange={(event) => {
                  const number = Number(event.target.value);
                  setSelected(number === current.number ? null : number);
                  setComparing(false);
                  setActiveExcerpt("");
                }}>
                  {detail.revisions.slice().reverse().map((item) => <option value={item.number} key={item.id}>Revision {item.number}{item === current ? " (current)" : ""}</option>)}
                </select>
              </label>
              {previous && <button type="button" className="button secondary small" aria-pressed={comparing} onClick={() => setComparing(!comparing)}><Columns2 size={16} aria-hidden="true" />{comparing ? "Hide comparison" : "Compare with previous"}</button>}
            </div>
          </section>
          {decision && (
            <div role="status" className={`notice ${decision.type === "approved" ? "notice-approved" : "notice-concern"}`}>
              {decision.type === "approved" ? <Check size={20} aria-hidden="true" /> : <ScrollText size={20} aria-hidden="true" />}
              <div><strong>{activityLabels[decision.type]} for revision {revision.number}</strong><p>{decision.message}</p></div>
            </div>
          )}
          {!decision && isCurrent && feedback && role === "submitter" && (
            <div className="notice notice-concern"><ScrollText size={20} aria-hidden="true" /><div><strong>Feedback on revision {feedback.revision}</strong><p>{feedback.message}</p></div></div>
          )}
          {!isCurrent && <div className="notice"><Info size={19} aria-hidden="true" /><div><strong>Viewing revision {revision.number}</strong><p>This revision is read-only. Review actions apply to revision {current.number}.</p></div></div>}
          <div className="action-notice" ref={actionNotice}>
            {actionError && <ErrorMessage message={actionError.message} retry={actionError.conflict ? onReload : undefined} retryLabel="Reload submission" />}
            <div className="sr-only" role="status">{pending ? "Saving review action" : ""}</div>
          </div>

          {comparing && previous && <RevisionComparison current={revision} previous={previous} />}
          <div className="review-layout">
            <div className="copy-column">
              <section className="panel copy-panel">
                <div className="panel-heading copy-heading">
                  <div className="section-title"><FileText size={20} aria-hidden="true" /><div><h2>Marketing copy</h2><p>Revision {revision.number} · {formatTime(revision.createdAt)}</p></div></div>
                </div>
                <div className="copy-text" ref={copyRef}>
                  {marked.map((part) => part.rules.length ? (
                    <mark
                      key={part.start}
                      tabIndex={-1}
                      data-excerpt={part.rules.join(" ")}
                      className={part.rules.includes(activeExcerpt) ? "active-excerpt" : undefined}
                    >{part.text}</mark>
                  ) : <span key={part.start}>{part.text}</span>)}
                </div>
                {revision.input.substantiation && <div className="supporting-copy"><h3>Supporting evidence</h3><p>{revision.input.substantiation}</p></div>}
              </section>
              <OfferReference revision={revision} />
            </div>
            <div className="evidence-column">
              <section className="panel evidence-panel">
                <div className="panel-heading">
                  <div><h2>Copy checks</h2><p>{revision.analysis.scope}</p></div>
                </div>
                <AnalysisSummary analysis={revision.analysis} />
                {concerns.length > 0 && (
                  <div className="check-list" key={revision.id}>
                    {concerns.map((check) => (
                      <CheckEvidence key={check.ruleId} check={check} onShowExcerpt={marked.some((part) => part.rules.includes(check.ruleId)) ? () => jumpToExcerpt(check.ruleId) : undefined}
                        change={previous ? previous.analysis.checks.some((item) => item.ruleId === check.ruleId && isConcern(item)) ? "Also flagged on the previous revision" : "Newly flagged on this revision" : undefined}>
                        <FindingActions ruleId={check.ruleId} confirmationReason={`${check.title}. ${check.suggestion ?? check.explanation}`.slice(0, 4000)} disposition={dispositions.get(check.ruleId)} mutate={canReview ? mutate : undefined} pending={pending} />
                      </CheckEvidence>
                    ))}
                  </div>
                )}
                {concerns.length === 0 && <p className="panel-caption muted">No concerns were flagged by these checks.</p>}
                <details className="coverage-details">
                  <summary>Passed and not applicable checks</summary>
                  <div className="check-list">
                    {revision.analysis.checks.filter((check) => !isConcern(check)).map((check) => (
                      <CheckEvidence key={check.ruleId} check={check}
                        change={previous?.analysis.checks.some((item) => item.ruleId === check.ruleId && isConcern(item)) ? "Previously flagged, no longer detected" : undefined} />
                    ))}
                  </div>
                </details>
              </section>
              {isCurrent && <ManualConcerns findings={detail.manualFindings} mutate={role === "reviewer" ? mutate : undefined} canAdd={canReview} pending={pending} />}
              {canReview && <ReviewDecision key={current.id} revision={current.number} unresolved={unresolved} openManual={openManual} canRequest={canRequest} mutate={mutate} pending={pending} />}
            </div>
          </div>
          <AiReviewPanel
            key={`${detail.case.id}:${revision.number}`}
            path={path}
            revision={revision}
            isCurrent={isCurrent}
            role={role}
            pending={pending}
            findings={detail.manualFindings}
            onPromote={canReview ? (input) => mutate("/manual-findings", input) : undefined}
            onReload={onReload}
          />
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
    <section className="panel reference-panel">
      <div className="section-title"><BookOpen size={18} aria-hidden="true" /><h2>Reference snapshot</h2></div>
      <dl>
        <div><dt>Policy version</dt><dd>{policyVersion}</dd></div>
        <div><dt>Offer version</dt><dd>{offerVersion ?? "Unknown"}</dd></div>
      </dl>
      {offerId && offerVersion && <MatchingOffer offerId={offerId} version={offerVersion} />}
      <Link className="text-link" href={offerId ? `/catalog#${encodeURIComponent(offerId)}` : "/catalog"}>View offer library<ArrowRight size={15} aria-hidden="true" /></Link>
    </section>
  );
}

function MatchingOffer({ offerId, version }: { offerId: string; version: string }) {
  const catalog = useResource<CatalogData>("/catalog");
  const offer = catalog.data?.offers.find((item) => item.id === offerId && item.version === version);
  if (catalog.loading) return <p className="muted">Loading offer terms…</p>;
  if (!offer) return <p className="muted">Terms for this offer version are unavailable.</p>;
  return <div className="offer-snapshot"><h3>{offer.name}</h3><OfferTerms offer={offer} /></div>;
}

function RevisionEditor({ path, revision, wasApproved, feedback, onCancel, onSaved }: {
  path: string; revision: Revision; wasApproved: boolean; feedback?: string; onCancel: () => void; onSaved: (detail: CaseDetail) => void;
}) {
  const catalog = useResource<CatalogData>("/catalog");
  return (
    <>
      {wasApproved && <div className="notice"><Info size={19} aria-hidden="true" /><div><strong>Editing approved copy</strong><p>Submitting creates revision {revision.number + 1} and sends it back for review.</p></div></div>}
      {feedback && <div className="notice notice-concern"><ScrollText size={20} aria-hidden="true" /><div><strong>Reviewer feedback</strong><p>{feedback}</p></div></div>}
      {catalog.loading ? <Loading label="Loading revision form" /> : (
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
    <section className="panel activity-panel">
      <div className="section-title"><Clock3 size={19} aria-hidden="true" /><h2>Activity</h2></div>
      {events.length ? <ol className="timeline">
        {events.slice().reverse().map((event) => (
          <li key={event.id}><div className="timeline-dot" /><div><strong>{activityLabels[event.type]}</strong><p>{event.message}</p><small>Revision {event.revision} · {event.actor} · <time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time></small></div></li>
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
    <section className="panel comparison-panel">
      <div className="panel-heading"><div><h2>Revision comparison</h2><p>{current.input.content === previous.input.content ? "The submitted text is identical across these revisions." : "Read the previous and selected copy side by side."}</p></div></div>
      <p className="panel-caption muted">{newlyFlagged} newly flagged, {selectedConcerns.length - newlyFlagged} still flagged, {noLongerFlagged} no longer flagged by the automated checks.</p>
      <div className="comparison-columns">
        {[previous, current].map((version) => (
          <div key={version.id}><h3>Revision {version.number}{version === previous ? " (previous)" : ""}</h3><div className="comparison-copy">{version.input.content}</div></div>
        ))}
      </div>
    </section>
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
