# Workspace design review

Claude Opus reviewed a non-sensitive design brief for the public fictional demo, not private source code. It prioritized claim → fact → decision: preserve evidence links near findings, keep the exact revision attached to decisions, separate check coverage from confidence and AI opinion, and retain keyboard navigation in custom controls.

Accepted: nearby offer facts and per-finding sources; coherent copy/evidence workspace; explicit revision context; discrete actual check states; AI remains advisory; custom controls need keyboard equivalence. Existing server guards and saved revision data are retained.

Rejected or constrained: do not change the user-approved purple status palette; do not invent “not run/errored” states absent from the analysis contract; do not claim approved-example case/revision provenance that the library does not store; do not add ambiguous reverse links for excerpts shared by several checks. No new backend scope follows from the critique.

Rendered review led to named check outcomes linked to evidence, shorter copy area and textarea, concise scope with complete disclosure, larger evidence text, and a selected-offer library with compact term rows. Final review additionally called for a neutral disabled approval button, exact finding/unknown counts in the checks header, and keeping copy/reference visible during long evidence review. These were accepted.

Claude also suggested requiring known format/completeness defaults. This is outside the presentation task and would change the honest unknown-context workflow, so existing payload semantics stay. Native date input remains accessible; all select dropdowns are custom. The Next development indicator is excluded from production design decisions.

Verification: docs/design/workspace-validation.md. Claude reviewed screenshots, not private source. GPT implementation workers and independent reviewers handled code and workflow guards.
