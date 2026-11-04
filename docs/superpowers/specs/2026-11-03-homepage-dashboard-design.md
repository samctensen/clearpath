> Historical first pass. Sam rejected its gray surfaces and donut. The authoritative revision is [homepage-direction-v4.md](../../design/homepage-direction-v4.md). Functionality and homepage isolation remain valid.

# Homepage dashboard design

Sam authorized cataloging the three references, deriving a design system, and implementing a homepage-only dark dashboard. He also asked for small delegated work and faster reviews. This document records builder choices within that scope; no further design-approval round is needed to execute his request.

## Intent and boundaries

Turn the homepage into a useful, distinctive review overview. Retain the list and every existing queue action. The stated take-home signals are product intuition and accuracy; our hypothesis is that clear work selection and truthful, understandable evidence demonstrate both. Do not claim measured throughput improvement.

Only `/` gets the new visual system. Detail, intake, and offer-library pages keep their existing shell and styling. No API/schema changes, no new analytics calls, and no AI generation on the homepage. Icons come from Sam's `/Users/sam/Developer/fontawesome/svgs/regular` assets, copied as a small local SVG subset.

## Page and visual system

Dark graphite work surface, precise thin borders, warm coral navigation/interaction accent, and cool semantic chart colors. Keep the existing locally served Manrope font, but use calmer 400–600 weights, tighter display tracking, and tabular numbers instead of the former heavy white-card treatment.

Tokens: canvas `#0d0f12`; sidebar `#111316`; panel `#171a1f`; raised/inset control `#1e2229`; border `#2c313a`; text `#eef0f4`; secondary text `#a1a8b4`; accent `#ed956f`. Chart ready `#9aaafa`, needs information `#edbd76`, changes requested `#83bce0`, copy approved `#83cfb0`.

Desktop: compact 224px sidebar, quiet topbar with role switch, header/new-submission action, one divided metrics strip, large status graphic beside an “Up next” panel, then the full queue. Panels use 14–18px radii, controls 8px; avoid identical statistic cards, gradient backgrounds, invented navigation items, fake notifications, and large decorative copy. Use whitespace and fine separators deliberately.

```text
ClearPath | Overview                              Demo role
          | Review overview                   New submission
Overview  | Awaiting decision / Ready / Needs information / Copy approved
Queue     | Review status graphic + legend     | Up next
Offers    | current snapshot, click to filter  | earliest open work
          | Review queue: status / search / product / date sort
Demo      | campaign rows, exact status, copy-check counts, launch date
```

At tablet widths, sidebar becomes a compact horizontal header. At phone widths, chart/legend and next-work panel stack; rows use the existing mobile card strategy or accessible horizontal table region. No document overflow. Focus rings and text must remain readable; respect reduced motion. No uncontrolled perpetual animation.

## Data and interaction

- Use the existing `CaseSummary[]` response. Search/product define the overview cohort; selected status filters the table while the chart retains all statuses in that same cohort. Label overview context so totals never seem inconsistent.
- Status distribution: a proportional segmented circular instrument, equal radius, subtle ticks, explicit four-item legend/counts. It is a snapshot, never a trend. Do not encode findings as segment height or invent severity/risk scores.
- Clicking a legend item filters the table; clicking the selected item again returns to all. SVG is supplementary; real buttons expose counts, labels, and pressed state to keyboard/screen-reader users.
- Metrics are awaiting decision (not approved), ready for review, needs information, and copy approved. Counts come only from current case status. Zero is valid; loading is not zero.
- Up next shows up to three actionable cases, earliest target date first, with stable tie-breaking. Reviewer: ready/needs information. Submitter: changes requested/needs information. Never call `updatedAt` waiting age.
- Show the earliest target date among unapproved cases, and overdue open count using local calendar day. Invalid/missing dates are excluded from date metrics, still retained in the list.
- Chart/filter values are actual counts. Do not call zero automatic findings “clean” or “approved”; the list label is “Copy checks.” AI/manual findings are not part of those summary counts.
- No data: honest empty graphic and create action. Failed load: retry, no plausible placeholder metrics. Loading: skeletons with accessible busy state.
- Preserve search/product/status/sort state when visiting a case and returning within the browser session. Restoring an invalid saved value falls back safely.

## Delegation

Root: catalog, tokens, icons, queue integration, data-to-UI wiring, browser verification, delivery. Claude worker A: dashboard-only shell. Claude worker B: chart component. GPT worker C: pure metrics/filter/priority helpers and targeted tests. File ownership is disjoint. One focused integration review, then typecheck/build and browser checks. No speculative backend refactor or extra approval loop.
