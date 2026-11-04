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
- [ ] Claude writes and runs failing Deno tests, implements analyze(input):Analysis, reruns tests.
- [ ] Independent review checks applicability and tests; integrate fixes and commit checkpoint.

## Task 2: persistent backend

Files: packages/models/*, apps/api/*; handoff backend.md.
- [ ] Write failing service and HTTP tests against real PGlite.
- [ ] Implement SQL migrations, model operations, service transitions and Fastify routes.
- [ ] Verify persistence, isolation, stale revision rejection, approval guards and malformed requests.
- [ ] Review and commit checkpoint.

## Task 3: Next.js workbench

Files: apps/web/src/*; handoff frontend.md.
- [ ] Implement queue, form/self-check, side-by-side review, dispositions, revision/history and catalog view.
- [ ] Integrate with API; use real failures/loading/empty states and visible demo identity switch.
- [ ] Typecheck, production build and browser-check the complete loop and mobile layout.
- [ ] Review and commit checkpoint.

## Task 4: release verification

- [ ] Run full tests, typechecks and build after integration.
- [ ] Obtain independent holdout cases and a Claude final review; fix substantive findings.
- [ ] Initialize CodeGraph (authorized), add run/deploy instructions and verify local app.
- [ ] Deploy both apps once hosting access exists; verify deployed flow and report actual URLs/limits.
