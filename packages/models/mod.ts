import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import {
  type Analysis,
  type CaseDetail,
  type CaseStatus,
  failure,
  type Result,
  type SubmissionInput,
  success,
} from "@clearpath/contracts";

type Row = Record<string, any>;
type DB = {
  query(sql: string, params?: unknown[]): Promise<Row[]>;
  transaction<T>(fn: (db: DB) => Promise<T>): Promise<T>;
  close(): Promise<void>;
};
const migration = new URL("./migrations/001_initial.sql", import.meta.url);
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
    const sql = await Deno.readTextFile(migration);
    for (const statement of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await db.query(statement);
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
  async hasWorkspace(workspace: string) {
    return (await this.db.query("SELECT id FROM workspaces WHERE id=$1", [workspace])).length > 0;
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
    const [c] = await db.query("SELECT * FROM cases WHERE id=$1 AND workspace_id=$2", [
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
  async listCases(workspace: string) {
    const rows = await this.db.query(
      "SELECT id FROM cases WHERE workspace_id=$1 ORDER BY updated_at DESC,id",
      [workspace],
    );
    const results = await Promise.all(rows.map((r) => this.getCase(workspace, r.id)));
    if (results.some((r) => !r.ok)) throw new Error("Unable to access storage");
    return results.flatMap((r) => r.ok ? [r.value.case] : []);
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
        "SELECT id,revision FROM cases WHERE id=$1 AND workspace_id=$2 FOR UPDATE",
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
