# ClearPath

ClearPath is a copy-review workspace for financial marketing teams. Submitters can check a draft before sending it for review. Reviewers see the copy, the applicable offer terms, and evidence for each flagged concern in one place. Change requests, revisions, and decisions stay with the submission.

[Open the hosted demo](https://clearpathfinancial.xyz) · [API health](https://clearpathfinancial.xyz/api/health)

The demo uses fictional offers and sample campaigns. The **Reviewer** and **Submitter** controls simulate both roles inside the same browser workspace. A signed cookie keeps each browser's workspace separate. Production authentication is outside the scope of this demo.

## Run locally

Use Node.js 24, the version used in CI. The npm install includes Deno 2.9.6.

```sh
npm ci
npm run dev
```

Open [ClearPath on localhost](http://localhost:3000). The API defaults to port 8000. Local data persists across restarts in the embedded PGlite database at `.data/clearpath`.

For configuration overrides, copy `.env.example` to `.env` at the repository root for the API, or copy `apps/web/.env.example` to `apps/web/.env.local` for the web app. Leave `DATABASE_URL` unset to use PGlite.

## Try the review workflow

1. Open **Changes requested** in the review queue and choose **Everyday Credit Card — partner email**. Revision 1 advertises an introductory APR but omits the promotional period and the later rate.
2. Copy the Everyday Credit Card example from **Offer library**. Return to the submission, switch to **Submitter**, and select **Revise submission**. Replace the marketing copy with the example, **Run checks**, then **Submit new revision**.
3. Switch to **Reviewer**. Use **Compare with previous** to see the copy and check changes. Select **Approve copy** under **Review decision**. The activity timeline records the decision on revision 2 alongside the earlier request.
4. To try an unseen edit, switch back to **Submitter** and choose **Edit copy**. Change the intro period from 12 to 18 months and run the checks. Submitting this edit creates a new revision that requires its own review.

Each decision applies to one exact revision. Every new revision reruns the checks and clears prior automated dispositions from the current review. Reviewers must dismiss automated concerns with a reason and resolve open manual concerns before approving copy. Manual concerns stay open across revisions until a reviewer resolves them.

## Optional AI second opinion

Open a submission and select **Generate AI review**. The saved revision receives two separate sections: **Compliance second opinion** for concerns and questions, and **Marketing feedback** for clarity, tone, and suggested wording. Generation sends that revision and its available offer/check context to OpenAI. It runs only on request; the result is saved to that exact revision and reused on later visits.

Reviewers can deliberately **Add as manual concern**. AI never changes the copy, rule results, or approval decision. Suggested language still needs human verification: validated quotations and reference identifiers do not guarantee that an interpretation or rewrite is correct. Historical results stay readable; a new revision needs its own opinion.

Set `OPENAI_API_KEY` in the API's environment to enable generation. Without a key, the normal workflow remains available. The default is `gpt-5.4-mini-2026-03-17` with medium reasoning; `OPENAI_MODEL` can override it. The demo allows 50 generation attempts globally per UTC day (`AI_REVIEW_DAILY_LIMIT`) and 10 per workspace. Failures count toward these limits; reading saved results does not. See the [AI evaluation and limitations](docs/reviews/2026-11-03-ai-review.md).

## What the checks cover

The six deterministic checks evaluate submitted text against the selected fictional offer and versioned review rules.

| Check | What it looks for |
| --- | --- |
| Review context | The offer, product, launch date, format, and completeness needed to evaluate the copy |
| Offer match | Explicit APRs and card promotional durations that differ from the selected offer |
| Introductory label | Introductory card rates that lack a nearby introductory label |
| Card promotional terms | The promotional period and later APR when applicable, with a specific exception for banners linked to applications |
| Loan repayment | Specific personal-loan payment or term claims that call for a human disclosure review |
| Approval claims | Explicit approval or preapproval claims that call for human substantiation |

Results distinguish passes, findings, unknowns, and checks that do not apply. **Copy approved** records the reviewer's decision on the submitted text. Layout, disclosure prominence, and publication clearance remain separate.

## Architecture

- `apps/web` runs the Next.js 16 App Router. It proxies `/api` requests to the API so the browser uses the same origin.
- `apps/api` runs Fastify on Deno 2.9.6. It computes analysis when a draft is checked or a revision is submitted and records workflow changes transactionally.
- `packages/contracts`, `packages/checks`, and `packages/models` hold the shared schemas, rule engine and offer catalog, and PostgreSQL persistence. Local development uses PGlite and the production deployment uses Neon Postgres.

## Verify

```sh
npm test        # Rule, persistence, and API tests
npm run check   # Deno and frontend type checks
npm run build   # Next.js production build
```

The AI release passed 116 local tests, both type checks, the production frontend build, and hosted workflow/AI smoke tests. Three hosted list samples after adding AI showed median latency of 0.98 seconds for a fresh visitor and 0.31 seconds for a returning visitor, with the same 2,045-byte response. The earlier query optimization reduced these from 10.21 and 1.75 seconds. These small samples are observations, not load-capacity or percentile guarantees. See the [performance measurements and limits](docs/reviews/2026-11-03-list-performance.md).

Run `node scripts/benchmark-list.mjs https://clearpathfinancial.xyz 3` to repeat the list measurement. Each sample creates six fictional records in a new isolated workspace.

Run `node scripts/smoke-ai.mjs https://clearpathfinancial.xyz` to verify generation, cached reuse, unchanged approval behavior, revision history, and isolation. This makes one paid generation request when AI is configured.

## Deploy

The hosted demo runs on Vercel, Deno Deploy, and Neon Postgres at https://clearpathfinancial.xyz. HTTP and the `www` hostname redirect to the canonical HTTPS address. See [deployment notes](docs/deployment.md) for the source bundle and environment settings.

Deploy the API using [Dockerfile.api](Dockerfile.api) with the repository root as the build context. Configure `DATABASE_URL` with a Neon Postgres connection string and run `npm run migrate` against that database before starting the API. Set `NODE_ENV=production`, a random `COOKIE_SECRET` of at least 32 characters, and `WEB_ORIGIN` to the exact allowed HTTPS web origins as a comma-separated list. The API binds to `0.0.0.0` by default in production. Override with `HOST` if needed. It uses the platform's `PORT` when present, then `API_PORT`, then 8000.

For the Vercel project, set the root directory to `apps/web` and allow access to the shared packages outside that directory. Set `API_ORIGIN` to the deployed API origin before building. Verify `/api/health` through the web origin and run the review workflow against the deployed app.
