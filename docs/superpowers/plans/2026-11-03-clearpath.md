# ClearPath implementation plan

> For agentic workers: use the shared contracts and your handoff in docs/handoffs. Work only in your assigned files. User authorized Claude and GPT parallel implementation; coordinator integrates.

**Goal:** A working copy-review loop with live checks, revisions, and persistent human decisions.
**Architecture:** Two apps in one repository. Deno/Fastify routes call a review service and isolated Postgres operations; Next.js consumes the API through a same-origin proxy. Shared contracts separate the tracks.
**Tech stack:** Deno, Fastify, Zod, Next.js, React, Neon Postgres; PGlite only for local development/tests.
**Spec:** docs/build-spec.md and docs/product-thesis.md.

## Global constraints

- Exact contract is packages/contracts/mod.ts; coordinate contract changes with root.
- Fictional product data and internal rules are labeled. Text review is not full legal clearance.
- No analysis results supplied by clients, no SQL in route handlers, and no unscoped database access.
- No production database fallback to local storage.
- All state changes pin the current revision and retain history.

## Review focus

- Unknown product, partial copy, and inapplicable format must not create a false pass.
- Concurrent/repeated decisions and stale browser revisions must not approve the wrong copy.
- Demo cookies must isolate visitors and avoid shared seeded workspace writes.
- Corrections must rerun real checks, preserving unresolved manual concerns.
- Public rendering must escape untrusted copy and prevent submitted URLs causing server fetches.

## Task 1: shared foundation and check engine

Files: packages/contracts/mod.ts, packages/checks/*, root configs; handoff checks.md.
- [x] Define contracts, fictional catalog, workflow and rule expectations before implementation.
- [x] Implement and verify the analyzer with Claude and Deno tests.
- [x] Review applicability against independent cases, integrate fixes, and commit the implementation checkpoint.

## Task 2: persistent backend

Files: packages/models/*, apps/api/*; handoff backend.md.
- [x] Cover model and HTTP behavior with tests against real PGlite.
- [x] Implement SQL migrations, model operations, service transitions and Fastify routes.
- [x] Verify persistence, isolation, stale revision rejection, approval guards and malformed requests.
- [x] Review and commit the implementation checkpoint.

## Task 3: Next.js workbench

Files: apps/web/src/*; handoff frontend.md.
- [x] Implement queue, form/self-check, side-by-side review, dispositions, revision/history and catalog view.
- [x] Integrate with the API and add loading, error, and empty states and a visible demo role switch.
- [x] Pass type checks and the production build. Verify the seeded revision and approval workflow in the desktop browser.
- [x] Review and commit the implementation checkpoint.
- [ ] Verify the mobile layout and new submission date picker in a browser.

## Task 4: release verification

- [x] Pass all 86 local tests, both type checks, and the production build after integration.
- [x] Integrate the independent 53-case holdout review and Claude's final integration review.
- [x] Initialize CodeGraph, document local and hosted setup, and verify the local workflow.
- [x] Deploy both apps and pass the hosted smoke test through the Vercel fallback on API revision `03gmk0t4mxa8`. Document the URLs and initial seeding latency in the [deployment notes](../../deployment.md).
- [ ] Verify custom-domain DNS and TLS.
- [ ] Push the reviewed release.
