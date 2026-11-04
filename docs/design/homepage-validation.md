# Homepage dashboard validation

Validated November 3, 2026 (Pacific). Current direction: [compact purple review desk](homepage-direction-v3.md).

- Full Deno suite: 137 passed before the final visual refinement. Final dashboard and launch-horizon tests: 21 passed after the shorter lane geometry, covering role priority, filter scope, strict calendar dates, same-date marker collisions, empty data and extreme date ranges.
- Final Next.js production build and TypeScript checks passed after merging the header and moving the demo-user control into its own component. `git diff --check` passed.
- Browser: desktop 1440px and phone 390px have no page-wide horizontal overflow. Desktop uses one 57px header row; the timeline panel is about 562px tall with the six-case fixture. No metric tiles remain. Mobile plot scroll stays contained and opens near the earliest target.
- Demo-user disclosure: role changes update actionable work and queue heading, Escape closes and restores trigger focus, clicking outside closes, and the panel stays inside the mobile viewport. Links use existing New submission and Offer library routes.
- Earlier integration checks covered queue status selection without changing the chart cohort, search/product/sort persistence after visiting a submission, empty search, chart keyboard navigation, marker-to-detail navigation, and the unchanged light detail shell.

Claude implemented the shell, timeline, compact controls and user menu in small file-scoped tasks; GPT handled the pure models, edge-case tests, reference synthesis, integration and independent reviews. Earlier reviews caught and resolved a missing helper after extracting the timeline model and redundant denominator state.

The chart uses actual launch dates and statuses from the existing list response. It does not infer waiting age from updatedAt, fabricate historical throughput, or treat copy approval as publication clearance. The 53 downloaded reference assets are documentation only and are excluded from deployment.
