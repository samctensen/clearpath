# Queue interactions, server queries and mobile navigation

User requests: full-row queue links and ellipsis menu; backend search/filter/sort/direction; retain actual mobile path chart; collapse mobile navigation.

Ownership: root owns row actions/stretched-link CSS, mobile shell hamburger, integration/release. queue_api owns contracts/store/API/tests. dashboard_api_client owns debounced keyed dashboard hook and queue query wiring. mobile_path_chart owns responsive map and loader CSS. queue_integration_review audits the combined changes read-only.

Contract: GET /api/dashboard with q, product, status, sort, direction, role, today; response rows, cohort, workspaceTotal, overview. Search/product define cohort; status only constrains queue. SQL performs filtering/order with workspace scope and bound user values. Existing /cases route remains compatible. Query output remains lightweight summaries; no Redis or database migration needed.

Row menu: Open review, Open in new tab, Copy review link. Real anchor stretches across each row, with the menu above it. No approval or destructive actions in this menu. Mobile navigation becomes a compact brand bar and disclosure menu. Mobile map retains curved branches, honest counts, markers and selected-state motion.

Verification: 141 tests passed and production frontend build passed. Independent integration review found no remaining material issues. Browser checks passed whole-row status-cell navigation, menu click isolation, first-item focus, arrow/End activation, Escape focus return, Tab advancing to the next row, clipboard success feedback, dropdown search/product/status query results, descending target-date order, rapid final-query results, and honest no-match state. The map remains mounted during queue-only changes. Mobile chart verified at320/390px; final44px target refinement awaits production measurements. Claude reviewed fictional screenshots only; same-tab arrows now point right, and mobile hit areas are enlarged.

Release isolation: concurrent policy/decision-log edits appeared in the shared checkout during packaging. They are preserved as separate worktree edits and excluded from this task’s commits/artifacts. The first Deno build failed because that unfinished work referenced an absent module; the clean backend snapshot is now being deployed. Production API must be ready before frontend release.
