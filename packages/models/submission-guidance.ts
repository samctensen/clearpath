import { isFixReasonId, summarizeChangeRequestFeedback, type ChangeRequestFeedback, type DashboardRow, type SubmissionGuidance } from "@clearpath/contracts";

type Row = Record<string, any>;
type Query = (sql: string, params?: unknown[]) => Promise<Row[]>;

// Old or inconsistent snapshots still have their immutable audit message. Do not
// let one unavailable source prevent opening the affected submission from a queue.
function readableFeedback(value: unknown): value is ChangeRequestFeedback {
  if (typeof value !== "object" || value === null) return false;
  const feedback = value as Record<string, unknown>;
  return typeof feedback.note === "string" && Array.isArray(feedback.items) && feedback.items.every((item) =>
    typeof item === "object" && item !== null && typeof item.title === "string" && typeof item.nextStep === "string");
}

const textField = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Keep the recorded action first, then its available evidence; never use live analysis. */
function requestItemText(item: Record<string, unknown>): string {
  const title = textField(item.title);
  const nextStep = textField(item.nextStep);
  const explanation = textField(item.explanation);
  const reviewerNote = textField(item.reviewerNote);
  const quote = textField(item.quote);
  return [...new Set([
    [title, nextStep].filter(Boolean).join(": "),
    explanation !== nextStep ? explanation : "",
    quote ? `“${quote}”` : "",
    ![nextStep, explanation].includes(reviewerNote) ? reviewerNote : "",
  ].filter(Boolean))].join(" ");
}

function selectedFeedback(value: unknown, message: unknown, reason?: string): string[] {
  // Only legacy requests lack a structured snapshot. A mixed audit message must
  // never replace a selected malformed item with an unrelated classified item.
  if (value == null) return (!reason || reason === "other_feedback") && textField(message) ? [message as string] : [];
  if (!isRecord(value)) return [];
  const snippets: string[] = [];
  if ((!reason || reason === "other_feedback") && textField(value.note)) snippets.push(value.note as string);
  const items: unknown[] = Array.isArray(value.items) ? value.items : [];
  for (const item of items) {
    if (!isRecord(item)) continue;
    const itemReason = item.source === "check" && typeof item.sourceId === "string" && isFixReasonId(`request:${item.sourceId}`)
      ? `request:${item.sourceId}` : "other_feedback";
    if (reason && itemReason !== reason) continue;
    const snippet = requestItemText(item);
    if (snippet) snippets.push(snippet);
  }
  return [...new Set(snippets)];
}

const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });
function boundedSnippet(text: string): string {
  if (Array.from(text).length <= 240) return text;
  let prefix = "";
  let length = 0;
  for (const { segment } of graphemes.segment(text)) {
    const size = Array.from(segment).length;
    if (length + size > 239) break;
    prefix += segment;
    length += size;
  }
  const characters = Array.from(prefix);
  const wordBoundary = characters.findLastIndex((character) => /\s/u.test(character));
  if (wordBoundary >= 160) prefix = characters.slice(0, wordBoundary).join("");
  return `${prefix.trimEnd()}…`;
}

/** Load only the requested current revisions; all guidance remains bound to that revision. */
export async function loadSubmissionRows(query: Query, workspace: string, ids: string[], reason?: string): Promise<Map<string, DashboardRow>> {
  if (ids.length === 0) return new Map();
  const records = await query(`
    SELECT c.id, c.status, c.revision, c.created_at, c.updated_at,
      r.created_at AS revision_created_at, r.input->>'title' AS title,
      r.input->>'productId' AS product_id, r.input->>'publisher' AS publisher,
      r.input->>'format' AS format, r.input->>'launchDate' AS launch_date,
      (SELECT count(*) FROM jsonb_array_elements(current_analysis.checks) x WHERE x->>'status' = 'finding') AS findings,
      (SELECT count(*) FROM jsonb_array_elements(current_analysis.checks) x WHERE x->>'status' = 'unknown') AS unknowns,
      (SELECT jsonb_agg(x->>'explanation' ORDER BY ordinal) FROM jsonb_array_elements(current_analysis.checks) WITH ORDINALITY AS entry(x, ordinal)
        WHERE x->>'status' = 'unknown' AND jsonb_typeof(x->'explanation') = 'string'
          AND (x->>'explanation') ~ '[^[:space:]]'
          AND ($3::text IS NULL OR x->>'ruleId' = $3)) AS explanations,
      e.message AS event_message, e.change_request, e.created_at AS event_created_at
    FROM cases c JOIN revisions r ON r.case_id = c.id AND r.number = c.revision
    CROSS JOIN LATERAL (SELECT CASE WHEN jsonb_typeof(r.analysis->'checks') = 'array'
      THEN r.analysis->'checks' ELSE '[]'::jsonb END AS checks) current_analysis
    LEFT JOIN LATERAL (SELECT message, change_request, created_at FROM events
      WHERE case_id = c.id AND revision = c.revision AND type = c.status
        AND type IN ('changes_requested', 'approved')
      ORDER BY sequence DESC LIMIT 1) e ON true
    WHERE c.workspace_id = $1 AND c.deleted_at IS NULL
      AND c.id IN (SELECT jsonb_array_elements_text($2::text::jsonb))`, [workspace, JSON.stringify(ids), reason?.startsWith("missing:") ? reason.slice("missing:".length) : null]);
  const result = new Map<string, DashboardRow>();
  for (const row of records) {
    let guidance: SubmissionGuidance | null = null;
    const make = (kind: SubmissionGuidance["kind"], text: string, date: unknown, itemCount?: number): SubmissionGuidance => ({
      kind, revision: row.revision, text: boundedSnippet(text), recordedAt: new Date(date as string).toISOString(),
      ...(itemCount ? { itemCount } : {}),
    });
    const explanations = [...new Set<string>(row.explanations ?? [])];
    if (reason) {
      if (row.status === "needs_information" && reason.startsWith("missing:") && explanations.length) {
        guidance = make("missing_information", explanations[0], row.revision_created_at, explanations.length);
      } else if (row.status === "changes_requested" && reason !== "details_unavailable") {
        const snippets = selectedFeedback(row.change_request, row.event_message, reason);
        if (snippets.length) guidance = make("reviewer_feedback", snippets[0], row.event_created_at, snippets.length);
      }
    } else if (row.status === "ready_for_review") guidance = make("awaiting_review", "Awaiting human review", row.revision_created_at);
    else if (row.status === "needs_information" && explanations.length) guidance = make("missing_information", explanations[0], row.revision_created_at, explanations.length);
    else if (row.status === "changes_requested" && row.event_message) guidance = make("reviewer_feedback", readableFeedback(row.change_request) ? summarizeChangeRequestFeedback(row.change_request) : row.event_message, row.event_created_at, selectedFeedback(row.change_request, row.event_message).length);
    else if (row.status === "approved" && row.event_message) guidance = make("approved_copy", row.event_message, row.event_created_at);
    result.set(row.id, { id: row.id, title: row.title, productId: row.product_id, publisher: row.publisher,
      format: row.format, launchDate: row.launch_date, status: row.status, revision: row.revision,
      findings: Number(row.findings), unknowns: Number(row.unknowns), createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(), guidance });
  }
  return result;
}
