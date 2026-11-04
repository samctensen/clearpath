import Fastify from "fastify";
import cookie from "@fastify/cookie";
import { z } from "zod";
import {
  type AiReview,
  type Analysis,
  type Offer,
  type Result,
  type SubmissionInput,
  submissionSchema,
  success,
} from "@clearpath/contracts";
import type { SeedPlan, Store } from "@clearpath/models";
import { type AiReviewProvider, AiReviewProviderError } from "./ai-review.ts";

type Dependencies = {
  store: Store;
  analyze: (input: SubmissionInput) => Analysis;
  offers: Offer[];
  policyVersion: string;
  cookieSecret: string;
  production?: boolean;
  seed?: boolean;
  allowedOrigins?: string[];
  aiReviewer?: AiReviewProvider;
  aiReviewDailyLimit?: number;
};
const revision = z.number().int().positive();
const text = (max: number) => z.string().trim().min(1).max(max);
const dispositionSchema = z.object({
  expectedRevision: revision,
  ruleId: text(100),
  action: z.enum(["confirmed", "dismissed"]),
  reason: z.string().trim().max(4000),
});
const manualSchema = z.object({
  expectedRevision: revision,
  title: text(160),
  quote: z.string().trim().max(20000),
  reason: text(4000),
});
const resolveSchema = z.object({ expectedRevision: revision, resolution: text(4000) });
const decisionSchema = z.object({
  expectedRevision: revision,
  decision: z.enum(["approve", "request_changes"]),
  note: z.string().trim().max(4000),
});
const revisionSchema = z.object({ expectedRevision: revision, input: submissionSchema });
const aiReviewSchema = z.object({ expectedRevision: revision }).strict();
const aiReviewQuerySchema = z.object({
  revision: z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(revision),
});
const error = (code: string, message: string) => ({ error: { code, message } });
class AiReviewQuotaError extends Error {}
class AiReviewUnavailableError extends Error {}

async function seedWorkspace(deps: Dependencies): Promise<string> {
  const samples = deps.offers.flatMap((offer, i) =>
    [0, 1].map((variant) => ({
      title: `${offer.name} — ${variant ? "partner email" : "campaign page"}`,
      productId: offer.productId,
      offerId: offer.id,
      content: variant && i === 0 ? "0% intro APR on purchases. Apply today." : offer.approvedCopy,
      format: variant ? "email" as const : "landing_page" as const,
      publisher: variant ? "Northstar Media" : "ClearPath Studio",
      launchDate: "2026-11-15",
      completeAsset: !(i === 1 && variant === 1),
      linksToApplication: null,
      substantiation: "",
    }))
  );
  const plans: SeedPlan[] = samples.map((input, i) => {
    const analysis = deps.analyze(input);
    if (i === 1) {
      return {
        input,
        analysis,
        decision: {
          decision: "request_changes",
          note: "Please add the promotional terms.",
          dispositions: [],
        },
      };
    }
    if (i === 4) {
      return {
        input,
        analysis,
        decision: {
          decision: "approve",
          note: "Approved for this demo.",
          dispositions: analysis.checks.filter((c) =>
            c.status === "finding" || c.status === "unknown"
          ).map((check) => ({
            ruleId: check.ruleId,
            action: "dismissed" as const,
            reason: "Reviewed for this fictional example.",
          })),
        },
      };
    }
    return { input, analysis };
  });
  const result = await deps.store.createSeededWorkspace(plans);
  if (!result.ok) throw new Error("Unable to seed workspace");
  return result.value;
}
export async function createApiServer(deps: Dependencies) {
  const aiReviewDailyLimit = deps.aiReviewDailyLimit ?? 50;
  if (
    !Number.isInteger(aiReviewDailyLimit) || aiReviewDailyLimit <= 0 ||
    aiReviewDailyLimit > 2147483647
  ) {
    throw new Error("AI_REVIEW_DAILY_LIMIT must be a positive 32-bit integer");
  }
  const inFlightAiReviews = new Map<string, Promise<Result<AiReview>>>();
  const app = Fastify({ logger: false, bodyLimit: 192 * 1024 });
  await app.register(cookie, { secret: deps.cookieSecret });
  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send(error("not_found", "Route not found"));
  });
  app.setErrorHandler((err, _req, reply) => {
    const statusCode = (err as { statusCode?: number }).statusCode;
    const status = statusCode && statusCode < 500 ? (statusCode === 413 ? 413 : 400) : 500;
    reply.status(status).send(
      error(
        status === 500 ? "storage" : "invalid",
        status === 500 ? "Unable to complete request" : "Invalid request",
      ),
    );
  });
  app.addHook("onRequest", async (req, reply) => {
    const demoRole = req.headers["x-demo-role"];
    if (demoRole !== undefined && demoRole !== "reviewer" && demoRole !== "submitter") {
      return reply.status(400).send(error("invalid", "Invalid demo role"));
    }
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      if (!req.headers["content-type"]?.toLowerCase().startsWith("application/json")) {
        return reply.status(400).send(error("invalid", "Content-Type must be application/json"));
      }
      const origin = req.headers.origin;
      if (origin) {
        const allowed = deps.allowedOrigins ??
          (deps.production ? [] : ["http://localhost:3000", "http://127.0.0.1:3000"]);
        let same = false;
        try {
          same = new URL(origin).origin === `${req.protocol}://${req.headers.host}`;
        } catch { /* reject invalid origin */ }
        if (!same && !allowed.includes(origin)) {
          return reply.status(403).send(error("invalid", "Origin is not allowed"));
        }
      }
    }
  });
  app.addHook("preHandler", async (req, reply) => {
    if (req.url.split("?")[0] === "/api/health") return;
    const signed = req.cookies.clearpath_workspace;
    const parsed = signed ? req.unsignCookie(signed) : null;
    let workspace = parsed?.valid ? parsed.value : null;
    const exists = workspace ? await deps.store.hasWorkspace(workspace) : false;
    const checkEmpty = exists && deps.seed !== false && req.method === "GET" &&
      req.url.split("?")[0] === "/api/cases";
    const summaries = checkEmpty ? await deps.store.listCases(workspace!) : undefined;
    const recoverEmpty = summaries?.length === 0;
    if (summaries && !recoverEmpty) (req as any).summaries = summaries;
    if (!exists || recoverEmpty) {
      workspace = deps.seed === false
        ? await deps.store.createWorkspace()
        : await seedWorkspace(deps);
      reply.setCookie("clearpath_workspace", workspace, {
        signed: true,
        maxAge: 7 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: "lax",
        secure: !!deps.production,
        path: "/",
      });
    }
    (req as any).workspace = workspace;
  });
  const ws = (req: unknown) => (req as any).workspace as string;
  const role = (req: any) => req.headers["x-demo-role"] ?? "reviewer";
  const reviewer = (req: any, reply: any) => {
    if (role(req) !== "reviewer") {
      reply.status(403).send(error("invalid", "Reviewer role required"));
      return false;
    }
    return true;
  };
  const submitter = (req: any, reply: any) => {
    if (role(req) !== "submitter") {
      reply.status(403).send(error("invalid", "Submitter role required"));
      return false;
    }
    return true;
  };
  const send = (reply: any, result: Result<unknown>, status = 200) =>
    result.ok ? reply.status(status).send(result.value) : reply.status(
      ({ not_found: 404, conflict: 409, invalid: 400, blocked: 422, storage: 500 } as const)[
        result.error.code
      ],
    ).send({ error: result.error });
  const parse = (schema: z.ZodTypeAny, body: unknown, reply: any): any => {
    const result = schema.safeParse(body);
    if (!result.success) {
      reply.status(400).send(error("invalid", "Invalid request"));
      return null;
    }
    return result.data;
  };
  const caseId = (req: any) => req.params.id as string;
  app.get("/api/health", () => ({ ok: true, storage: deps.store.storage }));
  app.get("/api/catalog", () => ({ offers: deps.offers, policyVersion: deps.policyVersion }));
  app.post("/api/analyze", async (req, reply) => {
    const input = parse(submissionSchema, req.body, reply);
    if (input) return deps.analyze(input);
  });
  app.get(
    "/api/cases",
    async (req) => (req as any).summaries ?? await deps.store.listCases(ws(req)),
  );
  app.post("/api/cases", async (req, reply) => {
    const input = parse(submissionSchema, req.body, reply);
    if (input) {
      return send(
        reply,
        await deps.store.createCase(ws(req), input, deps.analyze(input), role(req)),
        201,
      );
    }
  });
  app.get(
    "/api/cases/:id",
    async (req, reply) => send(reply, await deps.store.getCase(ws(req), caseId(req))),
  );
  app.get("/api/cases/:id/ai-review", async (req, reply) => {
    const query = parse(aiReviewQuerySchema, req.query, reply);
    if (!query) return;
    const result = await deps.store.getAiReview(ws(req), caseId(req), query.revision);
    if (!result.ok) return send(reply, result);
    return { available: !!deps.aiReviewer, review: result.value };
  });
  app.post("/api/cases/:id/ai-review", async (req, reply) => {
    const body = parse(aiReviewSchema, req.body, reply);
    if (!body) return;
    const workspace = ws(req), id = caseId(req), expected = body.expectedRevision as number;
    const current = await deps.store.getCase(workspace, id);
    if (!current.ok) return send(reply, current);
    if (current.value.case.revision !== expected) {
      return reply.status(409).send(error("conflict", "Revision has changed"));
    }
    const key = JSON.stringify([workspace, id, expected]);
    let pending = inFlightAiReviews.get(key);
    if (!pending) {
      const savedRevision = current.value.revisions.find((r) => r.number === expected)!;
      const offer = deps.offers.find((offer) =>
        offer.id === savedRevision.input.offerId &&
        offer.productId === savedRevision.input.productId &&
        offer.version === savedRevision.analysis.offerVersion
      ) ?? null;
      pending = (async () => {
        // Cache lookup belongs to the coalesced operation too: a delayed miss must not start
        // another paid call after the earlier operation has already persisted and cleared.
        const cached = await deps.store.getAiReview(workspace, id, expected);
        if (!cached.ok) return cached;
        if (cached.value) return success(cached.value);
        const reviewer = deps.aiReviewer;
        if (!reviewer) throw new AiReviewUnavailableError();
        const reserved = await deps.store.consumeAiReviewBudget(workspace, aiReviewDailyLimit, 10);
        if (!reserved) throw new AiReviewQuotaError();
        let generated;
        try {
          generated = await reviewer.generate({ revision: savedRevision, offer });
        } catch (cause) {
          // Only preserve the safe category; upstream messages may contain submitted text or secrets.
          throw new AiReviewProviderError(
            cause instanceof AiReviewProviderError && cause.statusCode === 504 ? 504 : 502,
            "AI review could not be generated",
          );
        }
        return await deps.store.saveAiReview(workspace, id, expected, generated);
      })().finally(() => {
        inFlightAiReviews.delete(key);
      });
      inFlightAiReviews.set(key, pending);
    }
    try {
      const result = await pending;
      if (!result.ok) return send(reply, result);
      return { available: !!deps.aiReviewer, review: result.value };
    } catch (cause) {
      if (cause instanceof AiReviewUnavailableError) {
        return reply.status(503).send(
          error(
            "unavailable",
            "AI review is not configured. You can continue reviewing this case.",
          ),
        );
      }
      if (cause instanceof AiReviewQuotaError) {
        return reply.status(429).send(
          error("quota", "Today's AI review limit has been reached. Try again after midnight UTC."),
        );
      }
      if (cause instanceof AiReviewProviderError) {
        const timeout = cause.statusCode === 504;
        return reply.status(timeout ? 504 : 502).send(error(
          timeout ? "timeout" : "provider",
          timeout
            ? "AI review timed out. You can try again."
            : "AI review could not be generated. You can try again.",
        ));
      }
      throw cause;
    }
  });
  app.post("/api/cases/:id/revisions", async (req, reply) => {
    if (!submitter(req, reply)) return;
    const b = parse(revisionSchema, req.body, reply);
    if (b) {
      return send(
        reply,
        await deps.store.revise(
          ws(req),
          caseId(req),
          b.expectedRevision,
          b.input,
          deps.analyze(b.input),
        ),
      );
    }
  });
  app.post("/api/cases/:id/dispositions", async (req, reply) => {
    if (!reviewer(req, reply)) return;
    const b = parse(dispositionSchema, req.body, reply);
    if (b) {
      return send(
        reply,
        await deps.store.disposition(
          ws(req),
          caseId(req),
          b.expectedRevision,
          b.ruleId,
          b.action,
          b.reason,
        ),
      );
    }
  });
  app.post("/api/cases/:id/manual-findings", async (req, reply) => {
    if (!reviewer(req, reply)) return;
    const b = parse(manualSchema, req.body, reply);
    if (b) {
      return send(
        reply,
        await deps.store.addManualFinding(
          ws(req),
          caseId(req),
          b.expectedRevision,
          b.title,
          b.quote,
          b.reason,
        ),
      );
    }
  });
  app.post("/api/cases/:id/manual-findings/:findingId/resolve", async (req, reply) => {
    if (!reviewer(req, reply)) return;
    const b = parse(resolveSchema, req.body, reply);
    if (b) {
      return send(
        reply,
        await deps.store.resolveManualFinding(
          ws(req),
          caseId(req),
          b.expectedRevision,
          (req.params as any).findingId,
          b.resolution,
        ),
      );
    }
  });
  app.post("/api/cases/:id/decision", async (req, reply) => {
    if (!reviewer(req, reply)) return;
    const b = parse(decisionSchema, req.body, reply);
    if (b) {
      return send(
        reply,
        await deps.store.decide(ws(req), caseId(req), b.expectedRevision, b.decision, b.note),
      );
    }
  });
  return app;
}
