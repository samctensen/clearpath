import { loadSubmissionRows } from "./submission-guidance.ts";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import {
  type AiReview,
  type AiReviewContent,
  type Analysis,
  type CaseDetail,
  type CaseStatus,
  type CaseSummary,
  type DashboardQuery,
  type DashboardResponse,
  type DecisionRecord,
  decodeQueueCursor,
  encodeQueueCursor,
  type DeleteCaseResult,
  failure,
  type QueueCohortItem,
  type QueuePage,
  type Result,
  type SubmissionInput,
  success,
} from "@clearpath/contracts";

/**
 * Every visitor shares one workspace, so a case link resolves for whoever
 * opens it. The id is fixed rather than generated so the shared workspace
 * survives restarts and is identical across processes.
 */
export const SHARED_WORKSPACE = "shared-demo-workspace";

export type SeedPlan = {
  input: SubmissionInput;
  analysis: Analysis;
  decision?: {
    decision: "approve" | "request_changes";
    note: string;
    dispositions: { ruleId: string; action: "confirmed" | "dismissed"; reason: string }[];
  };
};

type Row = Record<string, any>;
type DB = {
  query(sql: string, params?: unknown[]): Promise<Row[]>;
  transaction<T>(fn: (db: DB) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};
const migrations = ["001_initial.sql", "002_ai_reviews.sql", "003_soft_delete_cases.sql", "004_queue_paging.sql"];
class AiReviewBudgetExceeded extends Error {}
const id = () => crypto.randomUUID();
const iso = (date: unknown) => new Date(date as string).toISOString();
const initialStatus = (a: Analysis): CaseStatus =>
  a.checks.some((c) => c.status === "unknown" && c.ruleId === "review-context")
    ? "needs_information"
    : "ready_for_review";
const hash = async (value: string) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");

export async function createStore(
  options: { databaseUrl?: string; dataDir?: string; migrate?: boolean } = {},
) {
  let db: DB;
  if (options.databaseUrl) {
    const sql = postgres(options.databaseUrl, { max: 10 });
    const wrap = (client: any): DB => ({
      query: async (q, p = []) => await client.unsafe(q, p),
      transaction: async (fn) => await client.begin((tx: any) => fn(wrap(tx))),
      close: async () => {},
    });
    db = {
      ...wrap(sql),
      close: async () => {
        await sql.end();
      },
    };
  } else {
    if (options.dataDir) await Deno.mkdir(options.dataDir, { recursive: true });
    const client = await PGlite.create(options.dataDir ?? "memory://");
    const wrap = (c: any): DB => ({
      query: async (q, p = []) => (await c.query(q, p)).rows,
      transaction: async (fn) => await c.transaction((tx: any) => fn(wrap(tx))),
      close: async () => {},
    });
    db = {
      ...wrap(client),
      close: async () => {
        await client.close();
      },
    };
  }
  if (options.migrate !== false) {
    for (const migration of migrations) {
      const sql = await Deno.readTextFile(new URL(`./migrations/${migration}`, import.meta.url));
      for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
        await db.query(statement);
      }
    }
  }
  return new Store(db, options.databaseUrl ? "postgres" : "pglite");
}
export const createTestStore = () => createStore();

export class Store {
  constructor(private db: DB, readonly storage: "postgres" | "pglite") {}
  close() {
    return this.db.close();
  }
  async createWorkspace() {
    const workspace = id();
    await this.db.query("INSERT INTO workspaces(id) VALUES ($1)", [workspace]);
    return workspace;
  }
  async createSeededWorkspace(plans: SeedPlan[], workspaceId?: string): Promise<Result<string>> {
    for (const plan of plans) {
      const decision = plan.decision;
      if (!decision) continue;
      const concerns = plan.analysis.checks.filter((c) =>
        c.status === "finding" || c.status === "unknown"
      );
      const seen = new Set<string>();
      for (const disposition of decision.dispositions) {
        if (
          seen.has(disposition.ruleId) || !concerns.some((c) => c.ruleId === disposition.ruleId)
        ) return failure("invalid", "Rule is not a current concern");
        seen.add(disposition.ruleId);
        if (disposition.action === "dismissed" && !disposition.reason.trim()) {
          return failure("invalid", "A dismissal reason is required");
        }
      }
      if (
        decision.decision === "approve" &&
        concerns.some((c) =>
          !decision.dispositions.some((d) =>
            d.ruleId === c.ruleId && d.action === "dismissed" && d.reason.trim()
          )
        )
      ) return failure("blocked", "Dismiss every concern with a reason before approval");
      if (
        decision.decision === "request_changes" && !decision.note.trim() &&
        !decision.dispositions.some((d) => d.action === "confirmed")
      ) return failure("invalid", "Add feedback or confirm a concern");
    }
    try {
      const hashes = await Promise.all(plans.map((plan) => hash(plan.input.content)));
      const workspace = workspaceId ?? id();
      const cases: unknown[] = [],
        revisions: unknown[] = [],
        events: unknown[] = [],
        dispositions: unknown[] = [],
        decisions: unknown[] = [];
      const eventCount = plans.reduce(
        (total, plan) => total + 1 + (plan.decision ? 1 + plan.decision.dispositions.length : 0),
        0,
      );
      let timestamp = Date.now() - Math.max(0, eventCount - 1);
      const nextTime = () => new Date(timestamp++).toISOString();
      for (const [index, plan] of plans.entries()) {
        const caseId = id();
        const decision = plan.decision;
        const status = decision
          ? (decision.decision === "approve" ? "approved" : "changes_requested")
          : initialStatus(plan.analysis);
        const createdAt = nextTime();
        let updatedAt = createdAt;
        revisions.push({
          id: id(),
          case_id: caseId,
          number: 1,
          input: plan.input,
          analysis: plan.analysis,
          content_hash: hashes[index],
          created_at: createdAt,
        });
        events.push({
          id: id(),
          case_id: caseId,
          type: "submitted",
          actor: "submitter",
          message: "Submitted for copy review",
          revision: 1,
          created_at: createdAt,
        });
        for (const disposition of decision?.dispositions ?? []) {
          const reason = disposition.reason.trim();
          updatedAt = nextTime();
          const check = plan.analysis.checks.find((c) => c.ruleId === disposition.ruleId)!;
          dispositions.push({
            case_id: caseId,
            revision: 1,
            rule_id: disposition.ruleId,
            action: disposition.action,
            reason,
            actor: "reviewer",
            created_at: updatedAt,
          });
          events.push({
            id: id(),
            case_id: caseId,
            type: "finding_reviewed",
            actor: "reviewer",
            message: `${disposition.action}: ${check.title}${reason ? ` — ${reason}` : ""}`,
            revision: 1,
            created_at: updatedAt,
          });
        }
        if (decision) {
          updatedAt = nextTime();
          const note = decision.note.trim();
          const confirmed = decision.dispositions.filter((d) => d.action === "confirmed");
          const feedback = [
            note,
            ...confirmed.map((d) => `${d.ruleId}: ${d.reason.trim() || "Confirmed concern"}`),
          ].filter(Boolean).join("; ");
          decisions.push({
            id: id(),
            case_id: caseId,
            revision: 1,
            decision: decision.decision,
            note,
            created_at: updatedAt,
          });
          events.push({
            id: id(),
            case_id: caseId,
            type: status,
            actor: "reviewer",
            message: feedback || "Copy approved",
            revision: 1,
            created_at: updatedAt,
          });
        }
        cases.push({
          id: caseId,
          workspace_id: workspace,
          status,
          revision: 1,
          created_at: createdAt,
          updated_at: updatedAt,
        });
      }
      await this.db.transaction(async (db) => {
        await db.query("INSERT INTO workspaces(id) VALUES ($1)", [workspace]);
        await db.query(
          `INSERT INTO cases(id,workspace_id,status,revision,created_at,updated_at) SELECT id,workspace_id,status,revision,created_at,updated_at FROM jsonb_to_recordset($1::text::jsonb) AS x(id text,workspace_id text,status text,revision integer,created_at timestamptz,updated_at timestamptz)`,
          [JSON.stringify(cases)],
        );
        await db.query(
          `INSERT INTO revisions(id,case_id,number,input,analysis,content_hash,created_at) SELECT id,case_id,number,input,analysis,content_hash,created_at FROM jsonb_to_recordset($1::text::jsonb) AS x(id text,case_id text,number integer,input jsonb,analysis jsonb,content_hash text,created_at timestamptz)`,
          [JSON.stringify(revisions)],
        );
        if (dispositions.length) {
          await db.query(
            `INSERT INTO dispositions(case_id,revision,rule_id,action,reason,actor,created_at) SELECT case_id,revision,rule_id,action,reason,actor,created_at FROM jsonb_to_recordset($1::text::jsonb) AS x(case_id text,revision integer,rule_id text,action text,reason text,actor text,created_at timestamptz)`,
            [JSON.stringify(dispositions)],
          );
        }
        if (decisions.length) {
          await db.query(
            `INSERT INTO decisions(id,case_id,revision,decision,note,created_at) SELECT id,case_id,revision,decision,note,created_at FROM jsonb_to_recordset($1::text::jsonb) AS x(id text,case_id text,revision integer,decision text,note text,created_at timestamptz)`,
            [JSON.stringify(decisions)],
          );
        }
        await db.query(
          `INSERT INTO events(id,case_id,type,actor,message,revision,created_at) SELECT item->>'id',item->>'case_id',item->>'type',item->>'actor',item->>'message',(item->>'revision')::integer,(item->>'created_at')::timestamptz FROM jsonb_array_elements($1::text::jsonb) WITH ORDINALITY AS x(item,ordinal) ORDER BY ordinal`,
          [JSON.stringify(events)],
        );
      });
      return success(workspace);
    } catch {
      return failure("storage", "Unable to access storage");
    }
  }
  /**
   * Returns the shared demo workspace, seeding it the first time it is asked
   * for. Concurrent callers race on the workspace primary key; the loser's
   * transaction rolls back whole, so an already-present workspace is success.
   */
  async ensureSharedWorkspace(plans: SeedPlan[]): Promise<Result<string>> {
    if (await this.hasWorkspace(SHARED_WORKSPACE)) return success(SHARED_WORKSPACE);
    const seeded = await this.createSeededWorkspace(plans, SHARED_WORKSPACE);
    if (!seeded.ok && await this.hasWorkspace(SHARED_WORKSPACE)) return success(SHARED_WORKSPACE);
    return seeded;
  }

  /**
   * Discards everything in the shared workspace and seeds it again. Shared
   * state drifts as visitors review copy; this is how the demo returns to the
   * state its walkthrough describes.
   */
  async resetSharedWorkspace(plans: SeedPlan[]): Promise<Result<string>> {
    try {
      await this.db.transaction(async (db) => {
        const scoped = "WHERE case_id IN (SELECT id FROM cases WHERE workspace_id=$1)";
        // Children first: the schema declares no cascading deletes.
        for (
          const table of ["ai_reviews", "events", "decisions", "manual_findings", "dispositions"]
        ) await db.query(`DELETE FROM ${table} ${scoped}`, [SHARED_WORKSPACE]);
        await db.query(`DELETE FROM revisions ${scoped}`, [SHARED_WORKSPACE]);
        await db.query("DELETE FROM cases WHERE workspace_id=$1", [SHARED_WORKSPACE]);
        await db.query("DELETE FROM workspaces WHERE id=$1", [SHARED_WORKSPACE]);
      });
    } catch {
      return failure("storage", "Unable to access storage");
    }
    return await this.ensureSharedWorkspace(plans);
  }

  async hasWorkspace(workspace: string) {
    return (await this.db.query("SELECT id FROM workspaces WHERE id=$1", [workspace])).length > 0;
  }
  async hasStoredCases(workspace: string) {
    // Include deleted cases: an intentionally emptied workspace must never be reseeded.
    return (await this.db.query("SELECT id FROM cases WHERE workspace_id=$1 LIMIT 1", [workspace]))
      .length > 0;
  }
  private async event(
    db: DB,
    caseId: string,
    type: string,
    actor: string,
    message: string,
    revision: number,
  ) {
    await db.query(
      "INSERT INTO events(id,case_id,type,actor,message,revision) VALUES ($1,$2,$3,$4,$5,$6)",
      [id(), caseId, type, actor, message, revision],
    );
  }
  private async detail(db: DB, workspace: string, caseId: string): Promise<Result<CaseDetail>> {
    const [c] = await db.query("SELECT * FROM cases WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL", [
      caseId,
      workspace,
    ]);
    if (!c) return failure("not_found", "Case not found");
    const revisions = await db.query("SELECT * FROM revisions WHERE case_id=$1 ORDER BY number", [
      caseId,
    ]);
    const dispositions = await db.query(
      "SELECT * FROM dispositions WHERE case_id=$1 AND revision=$2 ORDER BY created_at,rule_id",
      [caseId, c.revision],
    );
    const manual = await db.query(
      "SELECT * FROM manual_findings WHERE case_id=$1 ORDER BY created_at,id",
      [caseId],
    );
    const events = await db.query("SELECT * FROM events WHERE case_id=$1 ORDER BY sequence", [
      caseId,
    ]);
    const current = revisions[revisions.length - 1];
    const input = current.input as SubmissionInput;
    const analysis = current.analysis as Analysis;
    return success({
      case: {
        id: c.id,
        title: input.title,
        productId: input.productId,
        publisher: input.publisher,
        format: input.format,
        launchDate: input.launchDate,
        status: c.status,
        revision: c.revision,
        findings: analysis.checks.filter((x) => x.status === "finding").length,
        unknowns: analysis.checks.filter((x) => x.status === "unknown").length,
        createdAt: iso(c.created_at),
        updatedAt: iso(c.updated_at),
      },
      revisions: revisions.map((r) => ({
        id: r.id,
        number: r.number,
        input: r.input,
        analysis: r.analysis,
        contentHash: r.content_hash,
        createdAt: iso(r.created_at),
      })),
      dispositions: dispositions.map((d) => ({
        ruleId: d.rule_id,
        action: d.action,
        reason: d.reason,
        actor: d.actor,
        createdAt: iso(d.created_at),
      })),
      manualFindings: manual.map((m) => ({
        id: m.id,
        title: m.title,
        quote: m.quote,
        reason: m.reason,
        status: m.status,
        resolution: m.resolution,
        createdAt: iso(m.created_at),
      })),
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        actor: e.actor,
        message: e.message,
        revision: e.revision,
        createdAt: iso(e.created_at),
      })),
    });
  }
  getCase(workspace: string, caseId: string) {
    return this.detail(this.db, workspace, caseId).catch(() =>
      failure<CaseDetail>("storage", "Unable to access storage")
    );
  }
  private aiReview(row: Row): AiReview {
    return {
      ...row.content,
      revision: row.revision,
      contentHash: row.content_hash,
      model: row.model,
      promptVersion: row.prompt_version,
      createdAt: iso(row.created_at),
    };
  }
  async getAiReview(
    workspace: string,
    caseId: string,
    revision: number,
  ): Promise<Result<AiReview | null>> {
    try {
      const [row] = await this.db.query(
        `SELECT a.* FROM cases c
         JOIN revisions r ON r.case_id=c.id AND r.number=$3
         LEFT JOIN ai_reviews a ON a.case_id=r.case_id AND a.revision=r.number
         WHERE c.id=$1 AND c.workspace_id=$2 AND c.deleted_at IS NULL`,
        [caseId, workspace, revision],
      );
      if (!row) return failure("not_found", "Case or revision not found");
      return success(row.case_id ? this.aiReview(row) : null);
    } catch {
      return failure("storage", "Unable to access storage");
    }
  }
  async saveAiReview(
    workspace: string,
    caseId: string,
    expectedRevision: number,
    generated: { content: AiReviewContent; model: string; promptVersion: string },
  ): Promise<Result<AiReview>> {
    return await this.db.transaction(async (db) => {
      // Share the edit lock, but never hold it while the provider is running.
      const [current] = await db.query(
        "SELECT revision FROM cases WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL FOR UPDATE",
        [caseId, workspace],
      );
      if (!current) return failure<AiReview>("not_found", "Case not found");
      if (current.revision !== expectedRevision) {
        return failure<AiReview>("conflict", "Revision has changed");
      }
      const [saved] = await db.query(
        `INSERT INTO ai_reviews(case_id,revision,content_hash,content,model,prompt_version)
         SELECT case_id,number,content_hash,$3::text::jsonb,$4,$5
         FROM revisions WHERE case_id=$1 AND number=$2
         ON CONFLICT (case_id,revision) DO NOTHING RETURNING *`,
        [
          caseId,
          expectedRevision,
          JSON.stringify(generated.content),
          generated.model,
          generated.promptVersion,
        ],
      );
      // Another instance may already have saved a result. Preserve its metadata and content.
      const row = saved ?? (await db.query(
        "SELECT * FROM ai_reviews WHERE case_id=$1 AND revision=$2",
        [caseId, expectedRevision],
      ))[0];
      if (!row) return failure<AiReview>("storage", "Unable to save AI review");
      return success(this.aiReview(row));
    }).catch(() => failure<AiReview>("storage", "Unable to access storage"));
  }
  async consumeAiReviewBudget(
    clientKey: string,
    globalLimit: number,
    clientLimit: number,
  ): Promise<boolean> {
    if (
      [globalLimit, clientLimit].some((limit) =>
        !Number.isInteger(limit) || limit <= 0 || limit > 2147483647
      )
    ) throw new Error("AI review limits must be positive 32-bit integers");
    try {
      return await this.db.transaction(async (db) => {
        // now() is stable within this transaction; both counters use the same database UTC day.
        for (
          const [scope, limit] of [["global", globalLimit], [
            `client:${clientKey}`,
            clientLimit,
          ]]
        ) {
          const rows = await db.query(
            `INSERT INTO ai_review_daily_usage(day,scope,requests)
             VALUES ((now() AT TIME ZONE 'UTC')::date,$1,1)
             ON CONFLICT (day,scope) DO UPDATE SET requests=ai_review_daily_usage.requests+1
             WHERE ai_review_daily_usage.requests < $2 RETURNING requests`,
            [scope, limit],
          );
          // Throw rather than return so a workspace cap also rolls back the global reservation.
          if (!rows.length) throw new AiReviewBudgetExceeded();
        }
        return true;
      });
    } catch (error) {
      if (error instanceof AiReviewBudgetExceeded) return false;
      throw error;
    }
  }
  async listDecisions(workspace: string): Promise<DecisionRecord[]> {
    const rows = await this.db.query(`
      SELECT d.id, d.case_id, d.revision, d.decision, d.created_at,
        c.revision AS current_revision, c.deleted_at IS NOT NULL AS case_deleted,
        r.input->>'title' AS title, r.input->>'productId' AS product_id,
        r.input->>'publisher' AS publisher,
        r.analysis->>'policyVersion' AS policy_version,
        r.analysis->>'offerVersion' AS offer_version,
        COALESCE(e.message, d.note) AS feedback, COALESCE(e.actor, 'reviewer') AS actor
      FROM decisions d
      JOIN cases c ON c.id = d.case_id
      JOIN revisions r ON r.case_id = d.case_id AND r.number = d.revision
      LEFT JOIN LATERAL (
        SELECT message, actor FROM events
        WHERE case_id = d.case_id AND revision = d.revision
          AND type = CASE WHEN d.decision = 'approve' THEN 'approved' ELSE 'changes_requested' END
        ORDER BY sequence DESC LIMIT 1
      ) e ON true
      WHERE c.workspace_id = $1
      ORDER BY d.created_at DESC, d.id DESC`, [workspace]);
    return rows.map((row) => ({
      id: row.id, caseId: row.case_id, caseDeleted: row.case_deleted, revision: row.revision,
      currentRevision: row.current_revision, title: row.title,
      productId: row.product_id, publisher: row.publisher, decision: row.decision,
      feedback: row.feedback, actor: row.actor, createdAt: iso(row.created_at),
      policyVersion: row.policy_version, offerVersion: row.offer_version,
    }));
  }
  async listCases(workspace: string): Promise<CaseSummary[]> {
    const rows = await this.db.query(
      `
      SELECT c.id, c.status, c.revision, c.created_at, c.updated_at,
        r.input->>'title' AS title, r.input->>'productId' AS product_id,
        r.input->>'publisher' AS publisher, r.input->>'format' AS format,
        r.input->>'launchDate' AS launch_date,
        (SELECT count(*) FROM jsonb_array_elements(r.analysis->'checks') AS check_item WHERE check_item->>'status' = 'finding') AS findings,
        (SELECT count(*) FROM jsonb_array_elements(r.analysis->'checks') AS check_item WHERE check_item->>'status' = 'unknown') AS unknowns
      FROM cases c JOIN revisions r ON r.case_id = c.id AND r.number = c.revision
      WHERE c.workspace_id = $1 AND c.deleted_at IS NULL ORDER BY c.updated_at DESC, c.id`,
      [workspace],
    );
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      productId: row.product_id,
      publisher: row.publisher,
      format: row.format,
      launchDate: row.launch_date,
      status: row.status,
      revision: row.revision,
      findings: Number(row.findings),
      unknowns: Number(row.unknowns),
      createdAt: iso(row.created_at),
      updatedAt: iso(row.updated_at),
    }));
  }
  async dashboard(workspace: string, query: DashboardQuery): Promise<DashboardResponse> {
    // Only allowlisted SQL identifiers/directions are interpolated. User values stay parameters.
    const sortKey = { launchDate: "calendar_day", title: "sort_title", updatedAt: "updated_at" }[query.sort];
    const keyCast = query.sort === "updatedAt" ? "timestamptz" : "text";
    const ascending = query.direction !== "desc";
    const back = query.before !== undefined;
    const token = query.before ?? query.after;
    const cursor = token === undefined ? null : decodeQueueCursor(token);
    const params: unknown[] = [workspace, query.q, query.product, query.status, query.limit + 1, query.view];

    // Rows sort by key (NULLS LAST), then creation and ID, so every page boundary is unique.
    let pageWhere = "TRUE";
    let passedWhere = "FALSE";
    if (cursor) {
      const key = `$${params.push(cursor.key)}::${keyCast}`;
      const keyIsNull = `$${params.push(cursor.key === null)}::boolean`;
      const created = `$${params.push(cursor.createdAt)}::timestamptz`;
      const id = `$${params.push(cursor.id)}::text`;
      const side = (nulls: string, compare: string, tie: string) =>
        `COALESCE(
          (${sortKey} IS NULL) ${nulls} ${keyIsNull}
          OR ((${sortKey} IS NULL) = ${keyIsNull} AND (
            (${keyIsNull} = false AND ${sortKey} ${compare} ${key})
            OR ((${keyIsNull} = true OR ${sortKey} = ${key})
              AND (created_at ${tie} ${created} OR (created_at = ${created} AND id ${tie} ${id})))
          )), false)`;
      const afterCursor = side(">", ascending ? ">" : "<", ">");
      const beforeCursor = side("<", ascending ? "<" : ">", "<");
      pageWhere = back ? beforeCursor : afterCursor;
      // Rows this page skipped: at or before the cursor going forward, strictly before it going back.
      passedWhere = back ? beforeCursor : `NOT (${afterCursor})`;
    }
    const pageOrder = back
      ? `(${sortKey} IS NULL) DESC, ${sortKey} ${ascending ? "DESC" : "ASC"}, created_at DESC, id DESC`
      : `(${sortKey} IS NULL) ASC, ${sortKey} ${ascending ? "ASC" : "DESC"}, created_at ASC, id ASC`;
    const cohortJson = query.scope === "page" ? "NULL::jsonb" : `COALESCE((
        SELECT jsonb_agg(to_jsonb(slim) ORDER BY slim.calendar_day ASC NULLS LAST, slim.created_at ASC, slim.id ASC)
        FROM (SELECT id, status, created_at, title, launch_date, calendar_day FROM cohort) slim
      ), '[]'::jsonb)`;

    const [result] = await this.db.query(`
      WITH matching AS (
        SELECT c.id, c.status, c.created_at, c.updated_at,
          r.input->>'title' AS title, r.input->>'launchDate' AS launch_date
        FROM cases c JOIN revisions r ON r.case_id = c.id AND r.number = c.revision
        WHERE c.workspace_id = $1 AND c.deleted_at IS NULL
          AND ($2 = '' OR strpos(lower((r.input->>'title') || ' ' || (r.input->>'publisher')), lower($2)) > 0)
          AND ($3 = 'all' OR r.input->>'productId' = $3)
      ), cohort AS MATERIALIZED (
        SELECT id, status, created_at, updated_at, title, launch_date,
          CASE WHEN launch_date ~ '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$' THEN
            CASE WHEN substring(launch_date, 9, 2)::int <= CASE substring(launch_date, 6, 2)
              WHEN '02' THEN CASE WHEN substring(launch_date, 1, 4)::int % 400 = 0
                OR (substring(launch_date, 1, 4)::int % 4 = 0 AND substring(launch_date, 1, 4)::int % 100 <> 0)
                THEN 29 ELSE 28 END
              WHEN '04' THEN 30 WHEN '06' THEN 30 WHEN '09' THEN 30 WHEN '11' THEN 30 ELSE 31 END
            THEN launch_date END
          END AS calendar_day,
          lower(title) COLLATE "C" AS sort_title
        FROM matching
      ), queue AS (
        SELECT * FROM cohort WHERE ($4 = 'all' OR status = $4)
          AND ($6 = 'all' OR ($6 = 'needs_attention' AND status IN ('changes_requested', 'needs_information'))
            OR ($6 = 'awaiting_review' AND status = 'ready_for_review') OR ($6 = 'approved' AND status = 'approved'))
      ), page AS (
        SELECT id, ${sortKey}::text AS sort_key, created_at::text AS cursor_created,
          row_number() OVER (ORDER BY ${pageOrder}) AS position
        FROM queue WHERE ${pageWhere}
        ORDER BY ${pageOrder} LIMIT $5
      ), page_rows AS (
        -- Findings and unknowns are counted for this page only, never across the whole cohort.
        SELECT p.position, p.sort_key, p.cursor_created, c.id, c.status, c.revision, c.created_at, c.updated_at,
          r.input->>'title' AS title, r.input->>'productId' AS product_id,
          r.input->>'publisher' AS publisher, r.input->>'format' AS format,
          r.input->>'launchDate' AS launch_date,
          (SELECT count(*) FROM jsonb_array_elements(r.analysis->'checks') AS check_item WHERE check_item->>'status' = 'finding') AS findings,
          (SELECT count(*) FROM jsonb_array_elements(r.analysis->'checks') AS check_item WHERE check_item->>'status' = 'unknown') AS unknowns
        FROM page p
        JOIN cases c ON c.id = p.id
        JOIN revisions r ON r.case_id = c.id AND r.number = c.revision
      )
      SELECT (SELECT count(*) FROM cases WHERE workspace_id = $1 AND deleted_at IS NULL) AS workspace_total,
        (SELECT count(*) FROM queue) AS queue_total,
        (SELECT count(*) FROM queue WHERE ${passedWhere}) AS passed_total,
        ${cohortJson} AS cohort,
        COALESCE((SELECT jsonb_agg(to_jsonb(page_rows) ORDER BY page_rows.position) FROM page_rows), '[]'::jsonb) AS rows`,
      params);

    let fetched: Row[] = result.rows;
    const hasExtra = fetched.length > query.limit;
    if (hasExtra) fetched = fetched.slice(0, query.limit);
    if (back) fetched = fetched.toReversed();
    let rows = fetched.map((row) => ({
      id: row.id, title: row.title, productId: row.product_id, publisher: row.publisher,
      format: row.format, launchDate: row.launch_date, status: row.status, revision: row.revision,
      findings: Number(row.findings), unknowns: Number(row.unknowns),
      createdAt: iso(row.created_at), updatedAt: iso(row.updated_at), guidance: null as import("@clearpath/contracts").SubmissionGuidance | null,
    }));
    const total = Number(result.queue_total);
    const passed = Number(result.passed_total);
    const offset = cursor === null ? 0 : back ? Math.max(0, passed - fetched.length) : passed;
    const mark = (row: Row | undefined) =>
      row === undefined
        ? null
        : encodeQueueCursor({ key: row.sort_key ?? null, createdAt: row.cursor_created, id: row.id });
    const page: QueuePage = {
      total,
      from: fetched.length === 0 ? 0 : offset + 1,
      to: offset + fetched.length,
      hasPrev: offset > 0,
      hasNext: offset + fetched.length < total,
      startCursor: mark(fetched[0]),
      endCursor: mark(fetched[fetched.length - 1]),
    };
    const attentionIds: string[] = query.role === "submitter" && result.cohort !== null
      ? result.cohort.filter((row: Row) => row.status === "changes_requested" || row.status === "needs_information")
        .slice(0, 3).map((row: Row) => row.id)
      : [];
    let submitterAttention: import("@clearpath/contracts").DashboardRow[] | null = null;
    if (query.role === "submitter") {
      const guidance = await loadSubmissionRows(this.db.query.bind(this.db), workspace,
        [...new Set([...rows.map((row) => row.id), ...attentionIds])]);
      rows = rows.map((row) => guidance.get(row.id) ?? row);
      if (result.cohort !== null) submitterAttention = attentionIds.flatMap((id) => {
        const row = guidance.get(id);
        return row ? [row] : [];
      });
    }
    if (result.cohort === null) {
      return { rows, page, cohort: null, workspaceTotal: Number(result.workspace_total), overview: null, submitterAttention };
    }

    const cohort: QueueCohortItem[] = result.cohort.map((row: Row) => ({
      id: row.id, title: row.title, launchDate: row.launch_date,
      status: row.status, createdAt: iso(row.created_at),
    }));
    const counts: Record<CaseStatus, number> = {
      ready_for_review: 0, needs_information: 0, changes_requested: 0, approved: 0,
    };
    let nextLaunchDate: string | null = null;
    let overdueCount = 0;
    // Cohort is already ordered by valid target date, then creation and ID in SQL.
    for (const row of result.cohort) {
      counts[row.status as CaseStatus]++;
      if (row.status === "approved" || row.calendar_day === null) continue;
      nextLaunchDate ??= row.calendar_day;
      if (row.calendar_day < query.today) overdueCount++;
    }
    const actionableStatus = query.role === "submitter" ? "changes_requested" : "ready_for_review";
    return {
      rows,
      submitterAttention,
      page,
      cohort,
      workspaceTotal: Number(result.workspace_total),
      overview: {
        total: cohort.length, openCount: cohort.length - counts.approved, counts,
        actionable: cohort.filter((item) => item.status === actionableStatus || item.status === "needs_information").slice(0, 3),
        nextLaunchDate, overdueCount,
      },
    };
  }
  async createCase(
    workspace: string,
    input: SubmissionInput,
    analysis: Analysis,
    actor: "reviewer" | "submitter" = "submitter",
  ): Promise<Result<CaseDetail>> {
    return await this.db.transaction(async (db) => {
      const caseId = id();
      await db.query("INSERT INTO cases(id,workspace_id,status,revision) VALUES ($1,$2,$3,1)", [
        caseId,
        workspace,
        initialStatus(analysis),
      ]);
      await db.query(
        "INSERT INTO revisions(id,case_id,number,input,analysis,content_hash) VALUES ($1,$2,1,$3::text::jsonb,$4::text::jsonb,$5)",
        [id(), caseId, JSON.stringify(input), JSON.stringify(analysis), await hash(input.content)],
      );
      await this.event(db, caseId, "submitted", actor, "Submitted for copy review", 1);
      return await this.detail(db, workspace, caseId);
    }).catch(() => failure<CaseDetail>("storage", "Unable to access storage"));
  }
  private async mutate(
    workspace: string,
    caseId: string,
    expected: number,
    fn: (db: DB, detail: CaseDetail) => Promise<Result<void>>,
  ): Promise<Result<CaseDetail>> {
    return await this.db.transaction(async (db) => {
      const rows = await db.query(
        "SELECT id,revision FROM cases WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL FOR UPDATE",
        [caseId, workspace],
      );
      if (!rows.length) return failure("not_found", "Case not found");
      if (rows[0].revision !== expected) return failure("conflict", "Revision has changed");
      const current = await this.detail(db, workspace, caseId);
      if (!current.ok) return current;
      const result = await fn(db, current.value);
      if (!result.ok) return result;
      await db.query("UPDATE cases SET updated_at=now() WHERE id=$1", [caseId]);
      return await this.detail(db, workspace, caseId);
    }).catch(() => failure<CaseDetail>("storage", "Unable to access storage"));
  }
  async deleteCase(
    workspace: string,
    caseId: string,
    expected: number,
  ): Promise<Result<DeleteCaseResult>> {
    return await this.db.transaction(async (db) => {
      const [current] = await db.query(
        "SELECT revision,status FROM cases WHERE id=$1 AND workspace_id=$2 AND deleted_at IS NULL FOR UPDATE",
        [caseId, workspace],
      );
      if (!current) return failure<DeleteCaseResult>("not_found", "Case not found");
      if (current.revision !== expected) {
        return failure<DeleteCaseResult>("conflict", "Revision has changed");
      }
      if (!["ready_for_review", "needs_information", "changes_requested"].includes(current.status)) {
        return failure<DeleteCaseResult>(
          "blocked",
          "Approved submissions cannot be deleted. Submit a revision first.",
        );
      }
      await db.query("UPDATE cases SET deleted_at=now(),updated_at=now() WHERE id=$1", [caseId]);
      await this.event(
        db,
        caseId,
        "deleted",
        "submitter",
        "Deleted submission from the active queue; review history retained",
        expected,
      );
      return success<DeleteCaseResult>({ deleted: true, id: caseId });
    }).catch(() => failure<DeleteCaseResult>("storage", "Unable to access storage"));
  }
  revise(
    workspace: string,
    caseId: string,
    expected: number,
    input: SubmissionInput,
    analysis: Analysis,
  ) {
    return this.mutate(workspace, caseId, expected, async (db) => {
      const n = expected + 1;
      await db.query(
        "INSERT INTO revisions(id,case_id,number,input,analysis,content_hash) VALUES ($1,$2,$3,$4::text::jsonb,$5::text::jsonb,$6)",
        [
          id(),
          caseId,
          n,
          JSON.stringify(input),
          JSON.stringify(analysis),
          await hash(input.content),
        ],
      );
      await db.query("UPDATE cases SET revision=$1,status=$2 WHERE id=$3", [
        n,
        initialStatus(analysis),
        caseId,
      ]);
      await this.event(db, caseId, "revised", "submitter", "Submitted a revised version", n);
      return success(undefined);
    });
  }
  disposition(
    workspace: string,
    caseId: string,
    expected: number,
    ruleId: string,
    action: "confirmed" | "dismissed",
    reason: string,
  ) {
    return this.mutate(workspace, caseId, expected, async (db, d) => {
      const check = d.revisions.at(-1)!.analysis.checks.find((c) => c.ruleId === ruleId);
      if (!check || !["finding", "unknown"].includes(check.status)) {
        return failure("invalid", "Rule is not a current concern");
      }
      if (action === "dismissed" && !reason.trim()) {
        return failure("invalid", "A dismissal reason is required");
      }
      if (["approved", "changes_requested"].includes(d.case.status)) {
        return failure("conflict", "This revision already has a decision");
      }
      await db.query(
        "INSERT INTO dispositions(case_id,revision,rule_id,action,reason,actor) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(case_id,revision,rule_id) DO UPDATE SET action=EXCLUDED.action,reason=EXCLUDED.reason,actor=EXCLUDED.actor,created_at=now()",
        [caseId, expected, ruleId, action, reason.trim(), "reviewer"],
      );
      await this.event(
        db,
        caseId,
        "finding_reviewed",
        "reviewer",
        `${action}: ${check.title}${reason.trim() ? ` — ${reason.trim()}` : ""}`,
        expected,
      );
      return success(undefined);
    });
  }
  addManualFinding(
    workspace: string,
    caseId: string,
    expected: number,
    title: string,
    quote: string,
    reason: string,
  ) {
    return this.mutate(workspace, caseId, expected, async (db, d) => {
      if (["approved", "changes_requested"].includes(d.case.status)) {
        return failure("conflict", "This revision already has a decision");
      }
      await db.query(
        "INSERT INTO manual_findings(id,case_id,title,quote,reason,status) VALUES ($1,$2,$3,$4,$5,$6)",
        [id(), caseId, title, quote, reason, "open"],
      );
      await this.event(db, caseId, "manual_finding", "reviewer", `${title}: ${reason}`, expected);
      return success(undefined);
    });
  }
  resolveManualFinding(
    workspace: string,
    caseId: string,
    expected: number,
    findingId: string,
    resolution: string,
  ) {
    return this.mutate(workspace, caseId, expected, async (db, d) => {
      const finding = d.manualFindings.find((f) => f.id === findingId);
      if (!finding) return failure("not_found", "Finding not found");
      if (finding.status === "resolved") return failure("conflict", "Finding already resolved");
      await db.query(
        "UPDATE manual_findings SET status='resolved',resolution=$1 WHERE id=$2 AND case_id=$3",
        [resolution, findingId, caseId],
      );
      await this.event(
        db,
        caseId,
        "finding_resolved",
        "reviewer",
        `${finding.title}: ${resolution}`,
        expected,
      );
      return success(undefined);
    });
  }
  decide(
    workspace: string,
    caseId: string,
    expected: number,
    decision: "approve" | "request_changes",
    note: string,
  ) {
    return this.mutate(workspace, caseId, expected, async (db, d) => {
      if (["approved", "changes_requested"].includes(d.case.status)) {
        return failure("conflict", "This revision already has a decision");
      }
      const checks = d.revisions.at(-1)!.analysis.checks.filter((c) =>
        c.status === "finding" || c.status === "unknown"
      );
      const open = d.manualFindings.filter((f) => f.status === "open");
      const confirmed = d.dispositions.filter((x) => x.action === "confirmed");
      if (
        decision === "approve" &&
        (open.length ||
          checks.some((c) =>
            !d.dispositions.some((x) =>
              x.ruleId === c.ruleId && x.action === "dismissed" && x.reason.trim()
            )
          ))
      ) {
        return failure(
          "blocked",
          "Dismiss every concern with a reason and resolve manual findings before approval",
        );
      }
      if (decision === "request_changes" && !note.trim() && !open.length && !confirmed.length) {
        return failure("invalid", "Add feedback or confirm a concern");
      }
      const status = decision === "approve" ? "approved" : "changes_requested";
      await db.query(
        "INSERT INTO decisions(id,case_id,revision,decision,note) VALUES ($1,$2,$3,$4,$5)",
        [id(), caseId, expected, decision, note.trim()],
      );
      await db.query("UPDATE cases SET status=$1 WHERE id=$2", [status, caseId]);
      const feedback = [
        note.trim(),
        ...confirmed.map((x) => `${x.ruleId}: ${x.reason || "Confirmed concern"}`),
        ...open.map((x) => `${x.title}: ${x.reason}`),
      ].filter(Boolean).join("; ");
      await this.event(db, caseId, status, "reviewer", feedback || "Copy approved", expected);
      return success(undefined);
    });
  }
}
