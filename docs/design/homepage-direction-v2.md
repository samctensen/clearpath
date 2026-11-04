# Homepage revision: black, identity, a useful instrument

Sam's feedback overrides the first visual treatment: “looks so AI generated still,” “darker colors,” “better identity,” “pie chart isn't cool enough,” and specifically “blacks not grays.” Keep the functionality and homepage-only boundary; replace the visual composition.

## Direction

An editorial review desk on true black. Main canvas #030303, navigation #060606, instrument #070707, controls #101010. Neutral borders #252525. No blue-gray/graphite surfaces, rounded card grid, gradients, glowing fake data, or decorative dashboard gadgets. Off-white #f1f0eb, muted warm-neutral #a09e99, a single signature signal-orange #ff8054. Status colors may be restrained: ready #e1ddd3, needs info #edb766, changes #98a8b5, approved #a9c28a. Orange means interaction/brand, not arbitrary severity.

Identity: ClearPath as a deliberate review desk. Typography must carry the design: large clean display heading, compact mono section indices/axis labels, fewer labels with more space. Thin rules and aligned columns; panels have near-square corners. A custom path/arrow wordmark is a brand mark, all UI icons remain the local Font Awesome subset. Do not introduce decorative navigation or invented data.

## Replace the donut

Build an interactive **Launch horizon**: target dates on x, workflow states as four horizontal lanes. Each real submission is a visible target marker; several on the same date must be separated so each remains clickable. Hover/focus reveals campaign title, target date, and workflow status; clicking opens that case. Clearly label target dates (not measured wait time or historical movement). A today marker provides real date context. Dates are real API launchDate calendar values. If all six targets are Nov 15, show that honest cluster; do not fake spread or animate throughput.

Use an accessible SVG instrument or HTML-over-SVG implementation. Keyboard-accessible links, real status filter buttons with counts, clear selected state. The status selection filters the queue only, while chart denominator/cohort remains search+product. The graphic should have fine axes, deliberate labels, date clusters, and strong orange current/selected detail rather than resemble a default chart package.

Chart inputs add `cases: CaseSummary[]` and `today: string` to the existing ReviewPipeline props. Root supplies both. Component must own responsive instrument behavior; no dependencies. Invalid dates are excluded from the timeline and counted/labeled as undated, not silently dropped from the overall count. Empty states stay honest. The plot covers current date and valid case targets; absolute dates avoid timezone drift. Stable marker ordering. No misleading links between current-state points that imply a history.

## Ownership

Claude shell worker: dashboard-shell.tsx, dashboard-shell.module.css, review-dashboard.module.css. Preserve integration props and existing CSS class names; redo the composition and tokens. Root changes homepage copy and integration. Main metrics should be an open typographic strip divided by rules, not four tiles. Up next and queue should sit on black with understated separation. Preserve mobile layout and focus behavior.

Claude chart worker: review-pipeline.tsx and review-pipeline.module.css only. Replace donut with launch horizon, add cases/today inputs.

Root: integration, accuracy review, tests/build, browser verification and deployment. Existing pure dashboard helper tests still apply. No backend or other page visual changes.
