"use client";

import { DashboardIcon } from "./dashboard/dashboard-icon";
import { useEffect, useId, useRef, useState } from "react";
import type { AiReviewContent, AiReviewResponse, DemoRole, ManualFinding, Revision } from "@clearpath/contracts";
import { api, ApiError, errorMessage } from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { Button, CheckBadge, ErrorMessage, buttonClass, cn, formatTime, panel, panelCaption, panelHeading } from "./ui";
import { checkCard, checkCardHeading, checkList, evidenceQuote, suggestion } from "./ui/check";
import { styles as ai } from "./ai-review.styles";

type Concern = AiReviewContent["compliance"]["concerns"][number];
type ManualConcernInput = { title: string; quote: string; reason: string };

function manualConcern(concern: Concern, revision: number): ManualConcernInput {
  return {
    title: concern.title.trim(),
    quote: (concern.quote ?? "").trim(),
    reason: `Added by reviewer from the AI second opinion on revision ${revision}.\n\n${concern.explanation}\n\nSuggested change: ${concern.suggestedChange}`.trim(),
  };
}

function generationError(failure: unknown) {
  if (failure instanceof ApiError) {
    if (failure.status === 429) return "The daily AI review limit has been reached. Try again after the daily limit resets.";
    if (failure.status === 503) return "AI review is unavailable. You can continue reviewing this submission.";
    if (failure.status === 502) return "OpenAI could not return a usable review. You can try generating again.";
    if (failure.status === 504) return "The AI review timed out. You can try generating again.";
    if (failure.status === 409) return "This revision is no longer current. Reload the submission to review the latest copy.";
  }
  return errorMessage(failure);
}

export function AiReviewPanel({ path, revision, isCurrent, role, pending, findings, onPromote, onReload }: {
  path: string;
  revision: Revision;
  isCurrent: boolean;
  role: DemoRole;
  pending: boolean;
  findings: ManualFinding[];
  onPromote?: (input: ManualConcernInput) => Promise<boolean>;
  onReload: () => void;
}) {
  const id = useId();
  const resource = useResource<AiReviewResponse>(`${path}/ai-review?revision=${revision.number}`);
  const [generating, setGenerating] = useState(false);
  const [failure, setFailure] = useState<{ message: string; conflict: boolean } | null>(null);
  const [promotionMessage, setPromotionMessage] = useState("");
  const request = useRef<AbortController | null>(null);
  const review = resource.data?.review;

  useEffect(() => () => request.current?.abort(), []);

  async function generate() {
    if (!isCurrent || pending || request.current || !resource.data?.available || review) return;
    const controller = new AbortController();
    request.current = controller;
    setGenerating(true);
    setFailure(null);
    try {
      const result = await api<AiReviewResponse>(`${path}/ai-review`, {
        body: { expectedRevision: revision.number },
        role,
        signal: controller.signal,
      });
      if (!controller.signal.aborted) resource.replace(result);
    } catch (error) {
      if (!controller.signal.aborted) {
        setFailure({ message: generationError(error), conflict: error instanceof ApiError && error.status === 409 });
      }
    } finally {
      if (!controller.signal.aborted) {
        request.current = null;
        setGenerating(false);
      }
    }
  }

  function referenceLabel(referenceId: string) {
    if (referenceId === "offer") return `Supplied offer${revision.analysis.offerVersion ? ` · ${revision.analysis.offerVersion}` : ""}`;
    return revision.analysis.checks.find((check) => check.ruleId === referenceId)?.reference.label ?? "Reference unavailable";
  }

  return (
    <section className={cn(panel, ai.panel)} aria-labelledby={`${id}-title`}>
      <div className={cn(panelHeading, ai.heading)}>
        <div>
          <div className={ai.sectionTitle}><DashboardIcon name="sparkles" size={20} aria-hidden="true" /><h2 id={`${id}-title`}>AI second opinion</h2><CheckBadge status="not_applicable" label="Advisory only" /></div>
          <p>Separate compliance and marketing feedback for revision {revision.number}. Human review and approval remain required.</p>
        </div>
        {!resource.loading && !resource.error && !review && resource.data?.available && isCurrent && (
          <button type="button" className={buttonClass({ variant: "secondary" })} disabled={generating || pending || failure?.conflict} onClick={() => void generate()}>
            {generating ? <DashboardIcon name="rotate-right" size={16} className={ai.spinner} aria-hidden="true" /> : <DashboardIcon name="sparkles" size={16} aria-hidden="true" />}
            {generating ? "Generating AI review…" : "Generate AI review"}
          </button>
        )}
      </div>

      {resource.loading && <p className={cn(ai.status, "text-muted")} role="status">Loading saved AI review…</p>}
      {resource.error && <div className={ai.status}><ErrorMessage message={resource.error} retry={resource.reload} retryLabel="Retry loading AI review" /></div>}
      {failure && <div className={ai.status}><ErrorMessage message={failure.message} retry={failure.conflict ? onReload : undefined} retryLabel="Reload submission" /></div>}
      <p className={generating ? "ai-review-status muted" : "sr-only"} role="status">{generating ? "Generating compliance and marketing feedback. This may take up to a minute; you can continue reviewing the submission." : promotionMessage}</p>

      {!resource.loading && !resource.error && !review && (
        <div className={ai.empty}>
          {!isCurrent ? (
            <p>No AI review was saved for this revision. New reviews can only be generated for the current revision.</p>
          ) : resource.data?.available ? (
            <p>Generate an opinion when you’re ready. This sends the saved revision and available offer context to OpenAI. Suggestions do not change the copy or review decision.</p>
          ) : (
            <p>AI review is not configured. Copy checks and human review remain available.</p>
          )}
        </div>
      )}

      {review && (
        <>
          <dl className={ai.metadata}>
            <div><dt>Revision</dt><dd>{review.revision}{isCurrent ? " (current)" : " (historical)"}</dd></div>
            <div><dt>Model</dt><dd>{review.model}</dd></div>
            <div><dt>Generated</dt><dd><time dateTime={review.createdAt}>{formatTime(review.createdAt)}</time></dd></div>
          </dl>
          <div className={ai.columns}>
            <section className={ai.section} aria-labelledby={`${id}-compliance`}>
              <div className={ai.sectionHeading}><h3 id={`${id}-compliance`}>Compliance second opinion</h3><p className={ai.prose}>{review.compliance.summary}</p></div>
              {review.compliance.concerns.length ? (
                <div className={checkList}>
                  {review.compliance.concerns.map((concern, index) => {
                    const input = manualConcern(concern, revision.number);
                    const added = findings.some((finding) => finding.title === input.title && finding.quote === input.quote && finding.reason === input.reason);
                    return (
                      <article key={index} className={checkCard}>
                        <div className={checkCardHeading}><h4>{concern.title}</h4><CheckBadge status="not_applicable" label={`${concern.severity === "high" ? "High" : concern.severity === "medium" ? "Medium" : "Low"} concern`} /></div>
                        {concern.quote && <blockquote className={evidenceQuote}>{concern.quote}</blockquote>}
                        <p className={ai.prose}>{concern.explanation}</p>
                        <p className={cn(suggestion, ai.prose)}><strong>Suggested change</strong>{concern.suggestedChange}</p>
                        {concern.referenceIds.length > 0 && <div className={ai.references}><strong>Supplied references</strong><ul>{concern.referenceIds.map((referenceId) => <li key={referenceId}>{referenceLabel(referenceId)}</li>)}</ul></div>}
                        {added ? <p className={ai.concernAdded}><DashboardIcon name="check" size={15} aria-hidden="true" />Added to manual concerns</p> : onPromote && (
                          <button type="button" className={buttonClass({ variant: "secondary", size: "small" })} disabled={pending} onClick={async () => {
                            if (await onPromote(input)) setPromotionMessage(`Added “${concern.title}” to manual concerns.`);
                          }}><DashboardIcon name="plus" size={15} aria-hidden="true" />Add as manual concern</button>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : <p className={cn("text-muted", panelCaption)}>No additional concerns were suggested. This is not an approval.</p>}
              {review.compliance.questions.length > 0 && <div className={ai.list}><h4>Questions to resolve</h4><ul>{review.compliance.questions.map((question, index) => <li className={ai.prose} key={index}>{question}</li>)}</ul></div>}
            </section>
            <section className={ai.section} aria-labelledby={`${id}-marketing`}>
              <div className={ai.sectionHeading}><h3 id={`${id}-marketing`}>Marketing feedback</h3><p className={ai.prose}>{review.marketing.summary}</p></div>
              {review.marketing.strengths.length > 0 && <div className={ai.list}><h4>Strengths</h4><ul>{review.marketing.strengths.map((strength, index) => <li className={ai.prose} key={index}>{strength}</li>)}</ul></div>}
              {review.marketing.suggestions.length > 0 && (
                <div className={checkList}>
                  {review.marketing.suggestions.map((suggestion, index) => (
                    <article key={index} className={cn(checkCard, ai.marketingCard)}>
                      <div className={checkCardHeading}><h4>{suggestion.title}</h4></div>
                      {suggestion.quote && <blockquote className={evidenceQuote}>{suggestion.quote}</blockquote>}
                      <p className={ai.prose}>{suggestion.rationale}</p>
                      <div className={ai.suggestedWording}><strong>Suggested wording</strong><p className={ai.prose}>{suggestion.suggestedRewrite}</p></div>
                    </article>
                  ))}
                </div>
              )}
              <p className={cn("text-muted", panelCaption)}>Suggested wording is not applied to the submission. Check offer facts and disclosures before using it.</p>
            </section>
          </div>
        </>
      )}
    </section>
  );
}
