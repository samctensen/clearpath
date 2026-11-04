# Frontend implementation report

The Next.js App Router serves the review queue at `/`, case review at `/cases/[id]`, intake at `/new`, and the fictional offer library at `/catalog`. Implementation lives in `apps/web/src/app`, `apps/web/src/components`, and `apps/web/src/lib`. The app uses the shared submission schema and labels, Manrope, Lucide, and responsive CSS.

- Queue filters and workload counts use the server response. Campaign search covers titles and publishers, and target dates can sort in either direction.
- Intake and revision editing share the same form. Preview results come from `POST /api/analyze` and clear when inputs change. Offer examples prefill the matching offer and copy.
- The review desk reads the selected revision and safely highlights exact server-provided text ranges. It shows check evidence, coverage and scope, offer and policy versions, and terms when the library still has that exact offer version.
- Review actions use the demo role header and current expected revision. Confirmations include the check's explanation or suggestion so change requests carry actionable context. Dismissals and manual resolutions require reasons. The current revision's decision controls respect server workflow constraints.
- Previous revisions are read-only. The comparison shows both copies and counts changes in automated findings by rule. Historical actions remain visible in the activity timeline.
- Browser storage holds only the role preference. Workspace persistence and every business action use the API.

## Verification

- `npm run typecheck --workspace @clearpath/web` passed.
- `npm run build --workspace @clearpath/web` passed for all four routes.
- Browser end-to-end verification is part of the root integration pass. This frontend pass verified compilation and inspected the implemented API and store against the shared contract.

## Integration notes

- Successful API bodies are read directly. Backend failure messages are displayed, and conflicting review actions offer a reload.
- The case detail loads before its catalog lookup. This keeps initial navigation to a case from launching two simultaneous workspace bootstrap requests.
- `GET /api/health` is intended for operational verification. The interface uses the workflow endpoints.
