"use client";

import { DashboardIcon } from "./dashboard/dashboard-icon";
import { useId, useState, type CSSProperties } from "react";
import type { AiReviewContent, AiReviewResponse, DemoRole, ManualFinding, Revision } from "@clearpath/contracts";
import { ApiError, errorMessage } from "@/lib/api";
import { useAiReviewGeneration, useAiReviewGenerationState } from "@/lib/use-ai-review";
import { useResource } from "@/lib/use-resource";
import { ErrorMessage, buttonClass, cn, formatTime } from "./ui";
import { evidenceQuote } from "./ui/check";
import { styles as ai } from "./ai-review.styles";

type Concern = AiReviewContent["compliance"]["concerns"][number];
type ManualConcernInput = { title: string; quote: string; reason: string };
type Severity = Concern["severity"];

const severityHue: Record<Severity, string> = {
  high: "var(--color-danger)",
  medium: "var(--color-info)",
  low: "var(--color-muted)",
};

const severityLabel: Record<Severity, string> = {
  high: "High concern",
  medium: "Medium concern",
  low: "Low concern",
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

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
  const generation = useAiReviewGeneration();
  const generationState = useAiReviewGenerationState(path, revision.number);
  const [promotionMessage, setPromotionMessage] = useState("");
  const review = resource.data?.review;
  const generating = generationState.pending;
  const failure = !generating && !review && generationState.error ? {
    message: generationError(generationState.error),
    conflict: generationState.error instanceof ApiError && generationState.error.status === 409,
  } : null;

  function generate() {
    if (!isCurrent || pending || generating || failure?.conflict || !resource.data?.available || review) return;
    generation.mutate({ path, revision: revision.number, role });
  }

  function referenceLabel(referenceId: string) {
    if (referenceId === "offer") return `Supplied offer${revision.analysis.offerVersion ? ` · ${revision.analysis.offerVersion}` : ""}`;
    return revision.analysis.checks.find((check) => check.ruleId === referenceId)?.reference.label ?? "Reference unavailable";
  }

  return (
    <section className={ai.panel} aria-label="AI second opinion">
      <div className={ai.lead}>
        <p>Compliance and marketing feedback on revision {revision.number}. Nothing here approves the copy; the review decision stays with a person.</p>
        {!generating && !resource.loading && !resource.error && !review && resource.data?.available && isCurrent && (
          <button type="button" className={buttonClass({ variant: "secondary" })} disabled={pending || failure?.conflict} onClick={generate}>
            {failure ? "Try again" : "Generate feedback"}
          </button>
        )}
      </div>

      {resource.loading && !generating && !failure && <p className={cn(ai.status, "text-muted")} role="status">Loading saved feedback…</p>}
      {resource.error && !generating && !failure && !review && <div className={ai.status}><ErrorMessage message={resource.error} retry={resource.reload} retryLabel="Retry loading AI review" /></div>}
      {failure && <div className={ai.status}><ErrorMessage message={failure.message} retry={failure.conflict ? onReload : undefined} retryLabel="Reload submission" /><p className="text-muted">Revision {revision.number} is saved. Copy checks and human review remain available.</p></div>}
      {generating && <div className={ai.status} role="status"><p><DashboardIcon name="rotate-right" size={15} className={ai.spinner} aria-hidden="true" /> <strong>Writing the second opinion…</strong></p><p className="text-muted">Revision {revision.number} is saved. You can keep reviewing while OpenAI works.</p></div>}
      <p className="sr-only" role="status">{promotionMessage}</p>

      {!generating && !failure && !resource.loading && !resource.error && !review && (
        <div className={ai.empty}>
          {!isCurrent ? (
            <p>No feedback was saved for this revision. New feedback can only be written for the current revision.</p>
          ) : resource.data?.available ? (
            <p>Generating sends the saved copy and the available offer context to OpenAI. Nothing it returns changes the copy or the review decision.</p>
          ) : (
            <p>AI feedback is not configured. Copy checks and human review remain available.</p>
          )}
        </div>
      )}

      {review && (
        <>
          <div className={ai.tracks}>
            <section className={ai.track} aria-labelledby={`${id}-compliance`}>
              <div className={ai.trackHeading}>
                <h3 id={`${id}-compliance`}>Compliance</h3>
                <span className={ai.trackState}>{review.compliance.concerns.length ? plural(review.compliance.concerns.length, "concern") : "No concerns"}</span>
              </div>
              <p className={cn(ai.prose, ai.trackLead)}>{review.compliance.summary}</p>

              {review.compliance.concerns.length > 0 && (
                <div className={ai.concerns}>
                  {review.compliance.concerns.map((concern, index) => {
                    const input = manualConcern(concern, revision.number);
                    const added = findings.some((finding) => finding.title === input.title && finding.quote === input.quote && finding.reason === input.reason);
                    return (
                      <article key={index} className={ai.concern}>
                        <h4>{concern.title}</h4>
                        <p className={ai.severity} style={{ "--sev": severityHue[concern.severity] } as CSSProperties}>{severityLabel[concern.severity]}</p>
                        {concern.quote && <blockquote className={evidenceQuote}>{concern.quote}</blockquote>}
                        <p className={cn(ai.prose, ai.body)}>{concern.explanation}</p>
                        <div className={ai.field}><strong>Suggested change</strong><p className={cn(ai.prose, ai.body)}>{concern.suggestedChange}</p></div>
                        {concern.referenceIds.length > 0 && (
                          <details className={ai.references}>
                            <summary><DashboardIcon name="chevron-right" size={11} className="cr-chevron" aria-hidden="true" />{plural(concern.referenceIds.length, "supplied reference")}</summary>
                            <ul>{concern.referenceIds.map((referenceId) => <li key={referenceId}>{referenceLabel(referenceId)}</li>)}</ul>
                          </details>
                        )}
                        {added ? <p className={ai.added}><DashboardIcon name="check" size={13} aria-hidden="true" />Added to manual concerns</p> : onPromote && (
                          <div className={ai.promote}>
                            <button type="button" className={buttonClass({ variant: "secondary", size: "small" })} disabled={pending} onClick={async () => {
                              if (await onPromote(input)) setPromotionMessage(`Added “${concern.title}” to manual concerns.`);
                            }}><DashboardIcon name="plus" size={13} aria-hidden="true" />Add as manual concern</button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              {review.compliance.questions.length > 0 && (
                <div className={ai.list}>
                  <h4>Questions to resolve</h4>
                  <ul>{review.compliance.questions.map((question, index) => <li className={cn(ai.prose, ai.listItem)} key={index}>{question}</li>)}</ul>
                </div>
              )}
            </section>

            <section className={cn(ai.track, ai.neutralQuote)} aria-labelledby={`${id}-marketing`}>
              <div className={ai.trackHeading}>
                <h3 id={`${id}-marketing`}>Marketing</h3>
                <span className={ai.trackState}>{review.marketing.suggestions.length ? plural(review.marketing.suggestions.length, "suggestion") : "No suggestions"}</span>
              </div>
              <p className={cn(ai.prose, ai.trackLead)}>{review.marketing.summary}</p>

              {review.marketing.strengths.length > 0 && (
                <div className={ai.list}>
                  <h4>Works well</h4>
                  <ul>{review.marketing.strengths.map((strength, index) => <li className={cn(ai.prose, ai.listItem)} key={index}>{strength}</li>)}</ul>
                </div>
              )}

              {review.marketing.suggestions.length > 0 && (
                <div className={ai.concerns}>
                  {review.marketing.suggestions.map((suggestion, index) => (
                    <article key={index} className={ai.concern}>
                      <h4>{suggestion.title}</h4>
                      {suggestion.quote && <blockquote className={evidenceQuote}>{suggestion.quote}</blockquote>}
                      <p className={cn(ai.prose, ai.body, suggestion.quote ? undefined : "mt-2")}>{suggestion.rationale}</p>
                      <div className={ai.wording}><strong>Suggested wording</strong><p className={ai.prose}>{suggestion.suggestedRewrite}</p></div>
                    </article>
                  ))}
                </div>
              )}

              <p className={ai.caution}>Suggested wording is never applied to the submission. Check the offer facts and disclosures before you use it.</p>
            </section>
          </div>

          <p className={ai.footnote}>
            Written by {review.model} on <time dateTime={review.createdAt}>{formatTime(review.createdAt)}</time>. It read revision {review.revision}{isCurrent ? ", the current revision." : ", which a later revision has replaced."}
          </p>
        </>
      )}
    </section>
  );
}
