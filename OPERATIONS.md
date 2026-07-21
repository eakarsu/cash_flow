# Operations runbook

## Release gate

1. Review the diff and confirm `LIVE_TRADING_ENABLED=false`.
2. Run `npm ci`, lint, type checking, unit/integration/E2E tests, production build, dependency audit, and Gitleaks.
3. Back up the ledger and verify the backup before applying a migration.
4. Run `npm run db:migrate` as a one-shot job. Run it again to prove replay is idempotent. Applied migration checksums must never change.
5. Start one application instance against the SQLite volume and verify `/api/health` returns `paper_only` and `liveTrading: false`.
6. Test operator login, auditor read-only access, a signed non-production provider event, reconciliation, kill-switch activation/release, and audit export.

`docker compose up --build` runs a one-shot migration service before the non-root, capability-dropped application. Bind port 3001 behind an HTTPS reverse proxy; do not expose it directly to the internet.

## Database and migration safety

The default deployment is a single application process using SQLite WAL and `synchronous=FULL`. Do not mount the same database into multiple hosts or network filesystems without replacing the storage adapter and re-running concurrency tests. Migration SQL is checked in under `migrations/`; the runner wraps each new file in `BEGIN IMMEDIATE`, records its SHA-256 checksum, and aborts if an applied file changes.

The app does not auto-migrate in production. It creates no demo transactions. Manual CSV imports append a new governed batch and never replace existing rows.

## Backup and restore

Schedule encrypted, access-controlled backups at a frequency that meets the business recovery point objective. With the `sqlite3` CLI available, create an online-consistent backup using its `.backup` command, then hash and copy it to a separate failure domain. Never copy only the main file while uncheckpointed `-wal` data exists.

Restore drill:

1. Stop application writes and preserve the damaged database, WAL, and SHM files for investigation.
2. Restore the backup into a new private path; never overwrite the only copy.
3. Run migrations against the restored path.
4. Start an isolated instance and download `/api/v1/audit-export` as an auditor.
5. Require both `ledgerHashChain` and `auditHashChain` to be true; compare latest source timestamps and reconciliation results to provider statements.
6. Record the observed recovery point/time and obtain operator approval before switching traffic.

Hash chains detect application-level record mutation but do not replace encrypted storage, access control, immutable backups, or provider statements.

## Provider operations

- Onboard only provider IDs backed by reviewed licensing/data-use contracts.
- Store provider secrets in a secret manager, not environment files committed to Git.
- Reject events outside the five-minute signature window. Providers must use unique idempotency keys and stable external IDs/versions.
- Investigate `needs_review` ingestion runs before reconciliation. A differing duplicate is evidence; never delete it or silently choose one value.
- Monitor source timestamp age, latest successful run, conflict counts, reconciliation discrepancies, and provider credential expiry.
- Rotate the provider HMAC secret in a coordinated maintenance window. The current implementation accepts one secret, so old/new overlap must be handled at the gateway or during a brief ingestion pause.

## Reconciliation and corrections

Reconciliation records opening balance, in-period ledger change, expected close, provider close, discrepancy, and source `asOf`. An exception is not a failed request; it is operational work requiring source investigation. Corrections use a reason, unique correction ID, reversal, and optional replacement. Direct ledger and audit updates/deletes are blocked by database triggers.

## Paper controls and incidents

The kill switch immediately blocks new orders and cancels remaining paper quantities. Activation requires a reason. Release requires a request and a different operator's approval. Never weaken or delete the control during an incident.

For stale/invalid source data, unexpected duplicates, reconciliation failures, secret exposure, or suspected ledger mutation:

1. Activate the kill switch.
2. Pause provider ingress at the gateway without deleting queued evidence.
3. Rotate affected secrets and revoke sessions.
4. Preserve the database/WAL, audit export, provider payload digests, proxy logs, and relevant backups.
5. Reconcile against independent provider statements.
6. Use append-only corrections if needed.
7. Obtain independent approval before release.

## User lifecycle

Create the first operator/auditor only with `npm run admin:bootstrap`; credentials are never printed. Bootstrap refuses existing emails. User deactivation, password rotation, and role changes require a controlled database administration procedure until a governed admin workflow is implemented; document every such intervention and preserve a pre-change backup.
