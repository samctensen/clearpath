import type { DashboardRow, SubmissionGuidance } from "@clearpath/contracts";

type Row = Record<string, any>;
type Query = (sql: string, params?: unknown[]) => Promise<Row[]>;

/** Load only the requested current revisions; all guidance remains bound to that revision. */
export async function loadSubmissionRows(query: Query, workspace: string, ids: string[]): Promise<Map<string, DashboardRow>> {
  if (ids.length === 0) return new Map();
  const records = await query(`
    SELECT c.id, c.status, c.revision, c.created_at, c.updated_at,
      r.created_at AS revision_created_at, r.input->>'title' AS title,
      r.input->>'productId' AS product_id, r.input->>'publisher' AS publisher,
      r.input->>'format' AS format, r.input->>'launchDate' AS launch_date,
      (SELECT count(*) FROM jsonb_array_elements(r.analysis->'checks') x WHERE x->>'status' = 'finding') AS findings,
      (SELECT count(*) FROM jsonb_array_elements(r.analysis->'checks') x WHERE x->>'status' = 'unknown') AS unknowns,
      (SELECT x->>'explanation' FROM jsonb_array_elements(r.analysis->'checks') x
        WHERE x->>'status' = 'unknown' AND COALESCE(x->>'explanation', '') <> '' LIMIT 1) AS explanation,
      e.message AS event_message, e.created_at AS event_created_at
    FROM cases c JOIN revisions r ON r.case_id = c.id AND r.number = c.revision
    LEFT JOIN LATERAL (SELECT message, created_at FROM events
      WHERE case_id = c.id AND revision = c.revision AND type = c.status
        AND type IN ('changes_requested', 'approved')
      ORDER BY sequence DESC LIMIT 1) e ON true
    WHERE c.workspace_id = $1 AND c.deleted_at IS NULL
      AND c.id IN (SELECT jsonb_array_elements_text($2::text::jsonb))`, [workspace, JSON.stringify(ids)]);
  const result = new Map<string, DashboardRow>();
  for (const row of records) {
    let guidance: SubmissionGuidance | null = null;
    const make = (kind: SubmissionGuidance["kind"], text: string, date: unknown): SubmissionGuidance => ({
      kind, revision: row.revision, text: Array.from(text).slice(0, 240).join(""), recordedAt: new Date(date as string).toISOString(),
    });
    if (row.status === "ready_for_review") guidance = make("awaiting_review", "Awaiting human review", row.revision_created_at);
    else if (row.status === "needs_information" && row.explanation) guidance = make("missing_information", row.explanation, row.revision_created_at);
    else if (row.status === "changes_requested" && row.event_message) guidance = make("reviewer_feedback", row.event_message, row.event_created_at);
    else if (row.status === "approved" && row.event_message) guidance = make("approved_copy", row.event_message, row.event_created_at);
    result.set(row.id, { id: row.id, title: row.title, productId: row.product_id, publisher: row.publisher,
      format: row.format, launchDate: row.launch_date, status: row.status, revision: row.revision,
      findings: Number(row.findings), unknowns: Number(row.unknowns), createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(), guidance });
  }
  return result;
}
