# Security model

## Boundaries

- The production server is `server.ts` plus `src/server/**`. Legacy experimental routes under `src/api/**` are not compiled or mounted.
- Bank/broker custody stays with the provider. The app stores normalized evidence and paper records, not bank login credentials or live brokerage authority.
- Provider IDs must be allowlisted and tied to a recorded license/contract reference. Signed ingestion is HMAC-authenticated, timestamp-bound, size-limited, currency/account-bound, and idempotent.
- Service operator and auditor tokens are distinct. Browser sessions are opaque, hash-only at rest, HttpOnly, SameSite=Strict, eight hours, and CSRF-protected. Login throttling/lockout is persistent.
- Operator actions are attributed. Auditor credentials cannot mutate data. Large paper orders and kill-switch release require a different operator.
- AI is not configured in the browser or server production path and cannot ingest, reconcile, set limits, approve, or execute.

## Ledger integrity

Ledger and audit tables are append-only at the database layer. Each record includes the previous record hash and a SHA-256 hash of canonical content. Audit exports recompute both chains. Source timestamps, receipt timestamps, external IDs/versions, payload digests, corrections, and reconciliation `asOf` times are retained.

This provides tamper evidence, not a cryptographic custody guarantee against a privileged host administrator who can replace the entire database and backups. Protect the host, encrypt the volume and backups, restrict shell/database access, and compare with independent source statements.

## Runtime requirements

Production startup fails when:

- `PUBLIC_APP_URL` is not HTTPS;
- any of the four runtime secrets is missing, weak, or reused;
- no licensed provider is configured;
- the ledger is in memory; or
- live trading is requested.

Use a trusted TLS-terminating proxy and certificate validation. No production code disables TLS verification. Security headers deny framing and object embedding, restrict content/connect sources, and enable HSTS in production. The container runs as an unprivileged user, drops Linux capabilities, uses `no-new-privileges`, and has a read-only root filesystem with only the ledger volume writable.

## Secret response

If a service token, provider secret, session, database, or backup is exposed: activate the kill switch, revoke/rotate the affected credential, invalidate sessions, inspect ingress/audit/provider logs, verify both hash chains and source reconciliations, and document the incident. Purge a leaked value from Git history and mirrors only through an authorized coordinated process; rotating it is mandatory even after purge.

## Dependency policy

`npm audit --omit=dev --audit-level=high` is a release gate, and CI also scans full Git history with Gitleaks. The production dependency set intentionally excludes the abandoned QuickBooks/request stack, vulnerable spreadsheet parser, CRA toolchain, client-side AI SDK path, and SQLite build chain found in the original project. Provider-specific adapters must receive the same license, TLS, timeout, size, retry, idempotency, and failure-path review before use.

## Known operational limits

- SQLite deployment is single-instance; multi-host scaling requires a reviewed transactional storage migration.
- At-rest encryption and immutable backup retention are infrastructure responsibilities.
- The application exposes no live trading, money movement, user self-registration, password reset, or automated role administration.
- Provider secret overlap during rotation requires gateway coordination or a short ingestion pause.
