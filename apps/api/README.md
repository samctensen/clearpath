# API

The Deno/Fastify API owns checks, revisions, feedback, and decisions. Shared contracts connect it to the Next.js frontend; PostgreSQL (PGlite locally) stores the review history. Workflow changes are transactional, and stale revisions cannot overwrite newer work.

## OpenAI integration

The [AI reviewer](src/ai-review.ts) calls the Responses API with the saved revision, matching offer, and check references. It requests a strict JSON schema, validates the response, and rejects unverifiable quotes or unknown reference IDs before saving. Results retain revision, model, and prompt-version metadata.

Requests run on demand, reuse saved results, and coalesce concurrent requests within an API instance. A database-backed usage budget and timeout bound consumption. AI failures leave deterministic checks and human review available.

## Configuration

Run `npm run dev:api` from the repository root. With `DATABASE_URL` unset, the API uses local PGlite storage at `.data/clearpath`.

For a hosted API, configure `DATABASE_URL`, `NODE_ENV=production`, and `WEB_ORIGIN` with the allowed frontend origins. Apply migrations with `npm run migrate` before starting. [Dockerfile.api](../../Dockerfile.api) uses the repository root as its build context. The frontend uses `API_ORIGIN` to reach the API.

Optional `OPENAI_API_KEY` enables on-demand AI opinions; it belongs only in the API environment. Without it, checks and human review still work. See the root [.env.example](../../.env.example) for the remaining defaults.

The shared demo role switch is not authentication. Production identity and access control are outside this implementation.
