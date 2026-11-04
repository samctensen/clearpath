import { analyze, offers, POLICY_VERSION } from "@clearpath/checks";
import { createStore } from "@clearpath/models";
import { createApiServer } from "./server.ts";
import { parseAiReviewDailyLimit, parseSeedCaseCount, parseWebOrigins } from "./config.ts";
import { createOpenAiReviewer } from "./ai-review.ts";
const production = Deno.env.get("NODE_ENV") === "production";
const databaseUrl = Deno.env.get("DATABASE_URL");
const cookieSecret = Deno.env.get("COOKIE_SECRET");
const origins = parseWebOrigins(Deno.env.get("WEB_ORIGIN"));
const openAiKey = Deno.env.get("OPENAI_API_KEY")?.trim();
const aiReviewDailyLimit = parseAiReviewDailyLimit(Deno.env.get("AI_REVIEW_DAILY_LIMIT"));
const seedCaseCount = parseSeedCaseCount(Deno.env.get("SEED_CASE_COUNT"));
if (production && (!databaseUrl || !cookieSecret || cookieSecret.length < 32 || !origins.length)) {
  throw new Error(
    "Production requires DATABASE_URL, WEB_ORIGIN, and COOKIE_SECRET of at least 32 characters",
  );
}
const store = await createStore({
  databaseUrl,
  dataDir: databaseUrl ? undefined : ".data/clearpath",
  migrate: !databaseUrl,
});
const app = await createApiServer({
  store,
  analyze,
  offers,
  policyVersion: POLICY_VERSION,
  cookieSecret: cookieSecret ?? "local-development-cookie-secret-change-me",
  production,
  allowedOrigins: origins.length ? origins : undefined,
  aiReviewDailyLimit,
  seedCaseCount,
  aiReviewer: openAiKey
    ? createOpenAiReviewer({
      apiKey: openAiKey,
      model: Deno.env.get("OPENAI_MODEL")?.trim() || undefined,
    })
    : undefined,
});
await app.listen({
  host: Deno.env.get("HOST") ?? (production ? "0.0.0.0" : "127.0.0.1"),
  port: Number(Deno.env.get("PORT") ?? Deno.env.get("API_PORT") ?? 8000),
});
