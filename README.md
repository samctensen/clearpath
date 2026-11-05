# ClearPath

A marketing copy-review workspace for a fictional financial services company.

[Open the demo](https://clearpathfinancial.xyz)

## The problem and our approach

ClearPath's compliance team reviews marketing through Excel and email. Copy, offer terms, feedback, and revisions are scattered, making review a bottleneck as the business grows.

**Our thesis: help reviewers reach defensible decisions with less reading, reference lookup, and back-and-forth.**

We treat each submission as a review case: the copy, its product context, recorded concerns, and revision history stay together. The demo assumes a central compliance team reviewing text from internal marketers and affiliate partners.

## Two roles, one review loop

**Submitters prepare better inputs and act on feedback.** They can check copy before submitting, see which information or corrections are needed, and open the next edit directly.

**Reviewers spend their time on judgment.** They select work from the review queue, inspect copy alongside offer terms and check evidence, and send specific change requests. When a revision returns, a comparison shows what changed. Approval belongs to the exact revision reviewed.

Every new revision reruns the checks and requires a new decision. The intended gain is less coordination and repeated reading; business time savings have not been measured.

## Checks and OpenAI second opinions

Six deterministic checks cover specific offer and policy conditions. The **OpenAI Responses API** adds an on-demand second opinion on meaning and communication, using the saved copy, matching offer version, check results, and supplied references.

In the submission workspace, both roles can generate two separate views:

- **Compliance:** potential misleading implications, contradictions, unsupported claims, and questions to resolve.
- **Marketing:** clarity, tone, audience fit, and suggested wording, with instructions to preserve offer facts and disclosures.

Reviewers can turn a useful AI concern into a recorded manual concern and include it in a change request. Opinions are saved against the exact revision with model and prompt-version metadata, then reused on later visits.

Submitted copy is treated as untrusted input. The API validates structured output, verifies quotations against the original copy, and rejects reference IDs outside the supplied context. AI suggestions cannot edit copy, resolve findings, or approve a submission; those remain explicit human actions. This supports the thesis by giving reviewers a focused starting point for judgment and submitters concrete material to improve.

The scope is **copy review**. Approval does not establish correct visual presentation or clear an asset for publication. The demo uses fictional data and a role switch in a shared workspace; it does not implement production authentication.

## Pages

| Page | Purpose |
| --- | --- |
| [Dashboard](apps/web/src/app/README.md) | Find the next review or correction, with a different view for each role. |
| [New submission](apps/web/src/app/new/README.md) | Gather context and check a draft before review. |
| [Submission workspace](apps/web/src/app/cases/[id]/README.md) | Review evidence, respond to feedback, compare revisions, and decide. |
| [Offer library](apps/web/src/app/catalog/README.md) | Give both roles the same offer terms and example copy. |
| [Policy guide](apps/web/src/app/policies/README.md) | Explain what each check covers and where judgment is needed. |
| [Decision log](apps/web/src/app/decisions/README.md) | Preserve the decision and the exact revision behind it. |

## Repo structure

One TypeScript monorepo keeps the workflow, contracts, and checks together, with two independently deployed apps:

- **`apps/web`** — Next.js / React frontend on Vercel. TanStack Query manages API caching and background refresh; `/api` requests proxy to the backend.
- **`apps/api`** — Fastify API running on Deno, hosted on Deno Deploy.
- **`packages/contracts`** — shared types and runtime validation.
- **`packages/checks`** — deterministic checks, fictional offers, and policy references.
- **`packages/models`** — database access, migrations, and transactional review workflow. Production uses Neon PostgreSQL; local development uses PGlite.

The visible queue refreshes every 30 seconds. Open cases check for new activity without replacing the revision or unsaved work on screen; saves refresh affected views immediately.

## Run locally

Use Node.js 24. From a fresh checkout:

```sh
npm ci
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). The Next.js frontend connects to a Deno/Fastify API on port 8000. Local data persists in PGlite at `.data/clearpath`; no external database or AI key is needed.

Set `OPENAI_API_KEY` in the root `.env` to enable optional AI reviews. [API setup](apps/api/README.md) covers PostgreSQL and deployment configuration.

```sh
npm test        # Unit, persistence, API, and workflow tests
npm run check   # Backend and frontend type checks
npm run build   # Production frontend build
```
