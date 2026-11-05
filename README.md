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

## Where automation helps

Six deterministic checks compare submitted text with fictional offer terms and a bounded policy pack. Results distinguish findings, missing context, passes, and checks that do not apply. Optional AI compliance and marketing opinions are separate, advisory inputs. A human owns the decision.

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
