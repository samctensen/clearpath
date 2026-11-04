# Homepage dashboard validation

Validated November 3, 2026 (Pacific). Current chart direction: [review map](review-map-handoff.md), informed by the [three requested reference posts](review-map-references.md). The accepted neutral-dark shell and deep purple primary action remain in place.

- Full Deno suite: 136 passed, 0 failed. The new model suite covers empty/all-approved data, status totals independent of copy findings, strict calendar ordering, invalid dates, capped cohorts, hidden preferred records and input immutability. All 20 focused dashboard/map tests passed.
- Final Next.js production build and TypeScript checks passed. No new dependencies or backend changes.
- Browser checks at 1440px and 390px: no page-wide horizontal overflow, complete status labels, wrapped inspector titles and metadata. The compact map replaces the sparse launch-date timeline and its obsolete model/tests.
- Clicking the branch itself or its status label filters the queue; search/product filters change the map cohort. Empty search and zero-count status selection show honest empty states without fabricated markers or motion.
- Hover reaches the full path through its transparent hit area; status outlines match their colors. The one-time selection sweep and slow ongoing particles are separate animations. The desktop particle route continues around the status border; the mobile perimeter retains an 8px corner radius. Reduced-motion CSS disables animations and transitions (code-reviewed).
- Enter/Space on a submission marker focuses and reveals the correct Open review link. Following it opened the matching case; back navigation restored the dashboard. Switching to Submitter updates the initial campaign and queue heading; Reviewer restores reviewer priorities.
- Independent review resolved keyboard selection/focus issues, truncated titles and mobile perimeter distortion. No remaining actionable geometry, pointer-layering or ResizeObserver lifecycle issues were identified.

Claude implemented the visual component in a small file-scoped task. GPT handled the model/tests, reference synthesis, integration, refinements and independent reviews. The map uses the existing lightweight case list. Copy findings remain separate from review status, and approval is not publication clearance. Reference assets are documentation only and excluded from deployment.
