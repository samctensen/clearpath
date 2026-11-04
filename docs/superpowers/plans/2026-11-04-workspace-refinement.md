# Workspace Refinement Implementation Plan

> **For agentic workers:** Execute small file-scoped tasks with independent review and integration by root. Sam explicitly authorized overnight execution and Claude design review.

**Goal:** Complete a cohesive review workflow that makes evidence and the next action easier to understand.
**Architecture:** Existing Next.js frontend and Deno API; shared dark shell and reusable custom select, scoped page modules. No API or schema redesign.
**Tech Stack:** React 19, Next.js 16, TypeScript, CSS modules, local FontAwesome.
**Spec:** docs/superpowers/specs/2026-11-04-workspace-design.md

## Global constraints
Preserve functional guards and endpoint contracts. Accepted dashboard map stays. No fabricated analytics or legal conclusions. Root owns globals/shell/shared header; workers own disjoint page files. New dropdowns consume the shared CustomSelect contract. Keep work on codex/homepage-dashboard; workers do not commit, deploy or manipulate Git.

## Review focus
- Historical revision or pending mutation must never enable decision actions.
- Keyboard dropdown dismissal must not lose selected value or steal focus; popup must stay in viewport.
- Loading and empty responses must remain distinct without hiding the entire workspace.
- Long copy/titles and unknown offer/product must remain readable on a phone.
- Existing example-prefill, source links, AI opinions and manual concerns must remain accessible.

## Tasks
- [x] Dashboard + controls worker: CustomSelect in components/ui/custom-select.tsx and CSS; dashboard card loaders in dashboard/dashboard-loading.tsx and CSS; review-queue.tsx/review-dashboard.module.css. Verify keyboard behavior, persisted filters, skeleton/error handling, solid tinted status pills and toolbar.
- [x] Submission/library worker: submission-form.tsx and catalog.tsx with scoped CSS. Preserve SubmissionForm and OfferTerms exports/signatures; use CustomSelect and PageHeader contracts. Verify all original form states, example hash/prefill and terms.
- [x] Case worker: case-review.tsx plus case CSS/coverage component. Preserve review-actions/check-evidence/AI behavioral contracts. Use CustomSelect for revisions and PageHeader. Verify no loss of history, manual concerns, decisions, AI or excerpt navigation.
- [x] Root: dark shared tokens/global styles, Workspace and DashboardShell for all routes, reusable PageHeader; preserve shell layout and icon-only demo menu. Review/implement shared status badges.
- [x] Claude: critique proposed and rendered designs against product functionality, accuracy and user's visual references. Record actionable conclusions and refine.
- [x] Root: integrate, production build and existing tests, targeted browser workflow on desktop/phone, independent final review.
- [ ] Root: commit/push PR and deploy verified frontend.

## Shared component interfaces
`CustomSelect` from `@/components/ui/custom-select`: props `{id?:string; label:string; value:string; options:readonly {value:string;label:string;disabled?:boolean;description?:string}[]; onChange:(value:string)=>void; disabled?:boolean; className?:string}`. `label` is its accessible name; parent supplies visible field text. No native select. Root moves dashboard tokens to :root so portal menus inherit them.
`PageHeader` from `@/components/ui/page-header`: props `{title:string; description?:string; back?:{href:string;label:string}; actions?:ReactNode; children?:ReactNode}`. Includes icon-only demo-user menu. Children are optional case context beside title. Root creates this; page workers can import before ready.
