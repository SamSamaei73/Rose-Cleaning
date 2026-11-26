# Rollback and backup boundaries

[Roll back Rose](https://github.com/SamSamaei73/Rose-Cleaning/actions/workflows/rollback.yml) is the production recovery workflow. Run it on `main` with an exact previously verified release ID from `/home/roseclea/rose-deploy/deployments.jsonl` or the Actions deployment summary. It uses the same restricted SSH key, pinned host, production environment and concurrency group as deployment.

1. Inspect the failing release and current/previous IDs in `rose-deploy/state.json`.
2. Select the known-good release, not an unverified build or branch.
3. Dispatch the rollback workflow and inspect its result.
4. Confirm `/api/health` reports that release and `/api/ready` returns `ready`.
5. Check the affected user journey in Chrome before declaring recovery complete.

Activation itself automatically restores the prior release if startup, health or readiness fails. A later production browser failure is visible as a failed Actions run and requires deciding whether to roll back; the workflow does not silently declare success.

The live rollback procedure was exercised on 25 November: [45645212541](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45645212541) selected attempt 1, and [45645603689](https://github.com/SamSamaei73/Rose-Cleaning/actions/runs/45645603689) restored attempt 2. Both exact release IDs were verified publicly after switching. They had identical source, so this proves Passenger release selection and restart, not database rollback.

## Retained recovery material

- Immutable release directories, `state.json` and append-only deployment log outside the web root.
- Original startup/web-root backup in `rose-deploy/legacy`.
- Private `production.env` backup before email activation and selector-variable backup before correcting inherited email switches.
- Reviewed schema migrations and service seed in Git; no automatic destructive migrations during deployment.

Application rollback never deletes or rewinds customer data, changes DNS, or restores an older database. Keep schema changes backward compatible with the previous release. Never run `supabase db reset` against production or replay the seed blindly.

These application/configuration backups do **not** constitute a full Supabase data backup or point-in-time recovery service. A full database restore drill has not been performed. Before a future data-changing migration, obtain a private database export/backup using the project's supported backup tools, verify its contents and restore it into an isolated disposable database. Do not buy PITR, reset database credentials or execute a production restore as a routine deployment step. The current completion release makes no database migration.
