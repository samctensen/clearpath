# Queue actions by demo role

## Scope and ownership

Branch `codex/queue-role-actions` is isolated from `80b2b27` in the managed `clearpath-role-actions` worktree. Preserve the concurrent policy and decision-log work in the original checkout.

Reviewer menus offer Approve copy and Request changes before a revision has a decision. Dialogs load fresh details, show the exact revision and marketing copy, and retain server approval gates. Blocked approval offers Continue review; a change request requires actionable feedback. Submitters can Revise or Delete unapproved submissions. Approved copy must be revised before deletion. Open review, Open in new tab, and Copy review link remain available.

Deletion removes a submission from active views while retaining revisions, decisions, dispositions, manual findings, AI opinions and a deletion event. No restore UI is included. Demo roles remain a workspace simulation, not account authentication.

Backend agent owned server, contracts, models, migration and tests. UI agent owned menus, dialogs and revision intent. An independent agent reviewed the implementation; Claude reviewed only screenshots of the fictional interface. Root integrated and verified the work.

## API and migration

`POST /api/cases/:id/delete` takes `{ expectedRevision }` and requires the submitter demo role. Success is `{ deleted: true, id }`. Wrong role returns 403; inaccessible/deleted cases 404; stale revision 409; approved case 422. Row locks serialize deletion with decisions, revisions and AI persistence. Deleted records are excluded from active reads and mutations. Empty active workspaces with retained deleted records are not reseeded.

Migration `003_soft_delete_cases.sql` adds nullable `cases.deleted_at`. Applied first to Neon test branch `br-steep-union-bfmicli3`, then production branch `br-quiet-wildflower-bf57kh5t`, project `ancient-bar-07154006`, database `clearpath`. Test migration preserved all 514 existing cases. Production schema verified.

## Verification

- Full suite: 146 passed, 0 failed. Independent focused review: 13 passed.
- Final production frontend build and TypeScript passed.
- Local browser: reviewer/submitter actions, blocked approval, successful approval, required feedback, successful request changes, approved-copy revision editor, no approved delete action, cancel/Escape focus return, deletion confirmation and success, queue removal and announcement.
- Mobile: 320px dialog fits without horizontal overflow; 390px delete confirmation, equal footer actions, 44px close target. Review-map dots and status endpoints have 44px touch height; mobile navigation opens and closes with Escape.
- Claude: no blocking visual defects. Incorporated a primary Continue review action when blocked, complete check counts, standard status pills, and equal mobile action widths.
- Production API revision `q8z8chqyqctg` is routed. Read-only smoke passed: Postgres health, 6 seeded rows, server search/status filtering with separate cohort counts, and detail loading.
- Automatic approval review rejected production mutation smoke tests. No production POST requests were made. Save/delete behavior was verified in the isolated local workspace and automated tests.

## Release

Backend commit `9a6fd5b` deployed from a clean 16-file Git bundle. Frontend deployment pending final source commit. Keep navigation limited to existing routes; policy/decision-log pages remain in the other checkout. Do not merge the parent homepage PR or invite reviewers without instruction.
