> First-pass tasks completed; visual treatment revised in response to Sam. See [homepage-direction-v3.md](../../design/homepage-direction-v3.md) for current direction. Final validation is recorded in docs/design/homepage-validation.md.

# Homepage Dashboard Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. User authorized parallel delegation and execution; keep each task confined to its listed files.

**Goal:** Deliver a dark, useful homepage dashboard with accurate status visualization and the existing review list.
**Architecture:** Route-specific shell and isolated CSS modules; a pure data model derives metrics from the existing lightweight API response. No backend changes.
**Tech Stack:** Next.js/React/TypeScript, CSS modules, SVG, local Font Awesome assets.
**Spec:** `docs/superpowers/specs/2026-11-03-homepage-dashboard-design.md`

## Global constraints

Only the homepage changes visually. Actual counts only; no fabricated trends/age. Copy-approved is not publication clearance. Zero/loading/error are distinct. Only root commits/deploys. Workers use disjoint files and do not modify dependencies, secrets, or other pages.

## Review focus

Status filtering must not collapse the overview denominator; date comparisons must respect calendar days; changing demo role must change actionable work; restored filters must not break navigation; dark styles must not leak onto detail/intake/catalog routes.

### Task 1: pure view model (GPT)

Own `apps/web/src/lib/dashboard.ts`, `scripts/dashboard_test.ts`.
Export `DashboardStatus = CaseStatus | "all"`; `DashboardFilters = {status: DashboardStatus; product: ProductId | "all"; search: string; sort: "asc" | "desc"}`; `dashboardStatuses: CaseStatus[]` (ready, needs information, changes requested, approved); `defaultDashboardFilters`; `parseDashboardFilters(value: unknown): DashboardFilters`; `dashboardCohort(cases, filters): CaseSummary[]` (search/product only); `dashboardRows(cases, filters): CaseSummary[]`; `buildDashboard(cases, role, today): {total, openCount, counts: Record<CaseStatus,number>, actionable: CaseSummary[], nextLaunchDate: string|null, overdueCount}`. `cases` is cohort, `role` is DemoRole, `today` is YYYY-MM-DD. Dates do not mutate inputs. Unknown dates sort last.

- [x] Tests for counts, role-specific priority, no approved work in next actions, past/today/future boundaries, invalid dates, search/product/status separation, invalid restored filters, and nonmutation.
- [x] Implement helpers; run `DENO_NO_PACKAGE_JSON=1 node_modules/.bin/deno test scripts/dashboard_test.ts`.

### Task 2: home shell (Claude A)

Own `apps/web/src/components/dashboard/dashboard-shell.tsx` and `dashboard-shell.module.css`.
Export `DashboardShell({children, role, onRoleChange}: {children: ReactNode; role: DemoRole; onRoleChange:(role:DemoRole)=>void})`. Own the homepage canvas, sidebar/topbar and role buttons. Root wires it into Workspace only for `/`. CSS root supplies the spec's `--dash-*` tokens, inherited by children. Use root's `DashboardIcon` component: `{name: string,size?:number,className?:string}`; available names documented in handoff. Real nav only: `/`, `/#submissions`, `/catalog`. No fake search/notification controls. Responsive and keyboard usable.

- [x] Implement scoped shell; inspect reference images and spec first.
- [x] Report file changes and integration assumptions; root runs consolidated check.

### Task 3: status graphic (Claude B)

Own `apps/web/src/components/dashboard/review-pipeline.tsx` and `review-pipeline.module.css`.
Export `ReviewPipeline({counts,total,selected,onSelect}: {counts:Record<CaseStatus,number>;total:number;selected:CaseStatus|"all";onSelect:(status:CaseStatus)=>void})`. Root handles toggling/filters. Proportional SVG ring with instrument detail, full numeric legend as accessible buttons, current count in center, no fake data or timers. Use shared inherited tokens. Component owns its panel/title/subtitle/empty state; root handles fetch loading/error.

- [x] Implement chart and labels; inspect references/spec first. No chart dependency.
- [x] Report geometry/zero behavior and integration assumptions.

### Task 4: integrate and deliver (root)

Own `review-queue.tsx`, new `dashboard/review-dashboard.module.css`, `dashboard/dashboard-icon.tsx`, local public SVG subset; minimal conditional in `workspace.tsx`; test task entry; docs.

- [x] Copy selected Font Awesome assets; create small icon renderer. Route-specific shell integration.
- [x] Build metrics strip, Up next, context/search controls, preserved filters, dense queue and honest loading/error/empty states.
- [x] Run targeted metrics tests, type checks, production build. Focused review of calculations, route isolation and accessibility; fix concrete issues.
- [x] Verify desktop/mobile, legend/status/search/product/sort, both roles, return navigation, and unchanged other routes in browser.
- [x] Commit in small logical slices; deploy the frontend, verify hosted result, open/update a focused PR. Record measured results and limitations.
