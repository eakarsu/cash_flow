# Completeness Review: cash_flow

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 155 project files (112 source files), 1 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished finance/trading application, not just an empty scaffold. Inspection found 112 source files across `src/`, `.aider.tags.cache.v4/`, `scripts/` using Next.js, React, Express, Python; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Integrate licensed market/bank/broker data with idempotent ingestion, reconciliation, and explicit source timestamps.
2. Add deterministic exposure, liquidity, loss, approval, and kill-switch limits outside any LLM decision path.
3. Implement ledger-grade transaction history, corporate-action/error correction, custody boundaries, and audit exports.
4. Backtest and paper-trade realistic failure, stale-data, duplicate-order, and partial-fill scenarios before live use.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- TLS certificate verification is disabled in inspected code.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.
- Regression risk is high because no recognizable project-owned automated tests cover the main path.

## Evidence inspected

- `README.md`
- `src/api/routes/contact.js:29`
- `README.md:203`
- `server.ts`
- `package.json`
- `Dockerfile`

## Recommended next action

Choose one real finance/trading journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-19)

Implemented the governed cash-operations and paper-risk journey on 2026-07-19. Contracted bank and broker sources are now registered with explicit provider, external account, currency, custody class, and license references. Provider batches require a five-minute timestamped HMAC signature, approved provider ID, source cutoff, stable external IDs/versions, and idempotency key; exact duplicates are harmless, differing duplicates become retained review exceptions, market snapshots require broker custody, and every record preserves source and receipt timestamps. Source-to-ledger reconciliation records opening balance, ledger change, expected/provider close, discrepancy, and knowledge `asOf` rather than silently accepting a mismatch.

Financial history is now a persistent append-only ledger rather than browser-local replacement state. Transactions, corporate actions, reversals, and corrections use integer minor units, custody currency boundaries, payload digests, and a SHA-256 previous-record chain; database triggers reject ledger/audit updates and deletes. Corrections append a reversal plus optional replacement, signed CSV imports are bounded and additive, and verified auditor exports include ledger, ingestion, reconciliation, audit evidence, and recomputed chain results. Operators and auditors use distinct permissions; browser sessions are opaque/hash-only, HttpOnly, SameSite=Strict, time-bounded, login-throttled, and CSRF-protected. Runtime startup fails closed on weak/reused secrets, non-HTTPS production URLs, in-memory production storage, missing provider allowlists, or any request to enable live trading.

Exposure, available liquidity, realized daily loss, order notional, stale market data, approval thresholds, and the kill switch are deterministic code and stored policy outside every LLM path. Orders and fills are paper-only: client order IDs and fills are idempotent, partial fills cannot overfill, larger orders require a different operator, approval rechecks current limits, activation cancels remaining paper quantities, and release requires a second operator. Recorded simulations cover stale data, duplicate orders, partial fills, provider failure, and limit breaches. The shipped browser bundle contains no OpenRouter client/key configuration or random forecast data; dashboards use observed cash history, while licensed-source onboarding, governed transaction entry/import/correction, controls, exceptions, and audit export are live UI paths.

Operational work includes a checksum-enforced transactional migration, safe explicit setup/migration/bootstrap commands, modern Vite/Node builds, a non-root capability-dropped read-only container and one-shot Compose migration topology, security/incident/backup/restore/provider/kill-switch runbooks, and CI gates for clean install, full-history Gitleaks, migration replay, lint, types, unit/integration/browser tests, build, dependency audit, and image build. Local validation passed 5 unit tests, 6 integration tests, and 1 live Playwright journey, plus two migration deployments, a compiled production-server health/auditor check, production build, Compose rendering, lint, type checking, `git diff --check`, zero npm vulnerabilities, current-tree Gitleaks, and a full 316-commit Gitleaks scan. The configured local Docker daemon was offline, so the image build remains an explicit CI gate.

Two generated files containing a historical OpenRouter credential pattern were removed from the current tree. `SECURITY_INCIDENT.md` records mandatory external launch work: the authorized owner must revoke/rotate the key, investigate provider usage/billing logs, purge the artifacts from Git history/mirrors/artifacts, rerun scans, and obtain security sign-off. Operators must also provision real licensed provider contracts/endpoints, production TLS and encrypted storage, monitored backup/restore infrastructure, and production users/secrets. Those external authority and infrastructure gates are intentionally not fabricated by the application.
