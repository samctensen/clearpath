# Claude implementation handoff: bounded check engine

Read docs/build-spec.md and packages/contracts/mod.ts. Own ONLY `packages/checks/engine.ts`, `packages/checks/engine.test.ts`, and `packages/checks/mod.ts`. Catalog is already defined; do not modify it or other contracts/configs. Other agents are building API/UI in parallel. Do not commit or install dependencies. Root handles integration.

Export `analyze(input: SubmissionInput): Analysis` from engine.ts; mod.ts reexports analyze and catalog exports. Six rule IDs and expected scenarios are specified in build-spec. All six results always appear, one per rule. Pure deterministic code, no network, files, Deno env, or model calls. Import types/catalog using relative .ts imports. Use const arrow functions. Each result has title, severity, kind, explanation, reference, optional exact excerpt and suggested action. Never invent quote offsets for missing text.

TDD: write behavior tests first with Deno.test and node:assert/strict. Run `deno test --allow-read packages/checks/engine.test.ts` (network resolution may need root escalation; ask root if blocked). Watch failure before implementation, then implement and run. Tests should cover specified positive/negative/unknown pairs, wrong ongoing APR, dates, banner exception, incomplete input, and negation. Keep scope honest and bounded rather than claiming arbitrary natural-language understanding. Use correct condition boundaries; if unsure return unknown with explanation.

Regulatory links: https://www.consumerfinance.gov/rules-policy/regulations/1026/16/ and /24/. Approval claim rule is an invented company policy; legal references are context. Copy catalogue is fictional. Use stable source labels and policyVersion.

Return a concise report with files, test results, limitations, and any contract issue. Do not delegate or inspect secrets. Do not touch unrelated repos. Write a report to docs/handoffs/checks-report.md if useful.
