# Cash Flow Manager

Cash Flow Manager is a governed cash-operations ledger with licensed provider ingestion, reconciliation, deterministic risk limits, and paper-only order simulation. It does not take custody, store bank passwords, or send live broker orders.

## Supported journey

1. An operator registers a bank or broker source that is present in `LICENSED_PROVIDERS` and records the real license/contract reference.
2. The provider submits a timestamped HMAC-signed batch. Source account, currency, external IDs, versions, source timestamps, and idempotency keys are validated.
3. Exact duplicates are harmless. Reused source versions with different content create visible review exceptions rather than overwriting history.
4. Operators reconcile a source closing balance to append-only ledger changes. Corrections append a reversal and replacement; ledger and audit rows cannot be updated or deleted.
5. Market snapshots from licensed broker sources feed deterministic exposure, liquidity, daily-loss, stale-data, approval, and kill-switch checks.
6. Orders and fills are paper records only. Larger orders require an independent operator, partial fills cannot overfill, and kill-switch release requires a second operator.
7. Auditors can export ledger, ingestion, reconciliation, and audit evidence with verified SHA-256 hash-chain results.

AI is intentionally excluded from ingestion, reconciliation, limits, approvals, and execution. Dashboard forecasts use observed historical cash flows and deterministic scenarios.

## Requirements

- Node.js 24.x
- npm
- A durable SQLite-compatible volume for local/single-instance deployment
- HTTPS reverse proxy, encrypted storage, and an approved backup target for production
- Contracted providers capable of the signed ingestion contract

## Local setup

```bash
./setup.sh
cp .env.example .env
```

Fill four different random secrets of at least 32 characters, set the approved provider IDs, then run the explicit state-changing steps:

```bash
npm run db:migrate
BOOTSTRAP_EMAIL=operator@example.com \
BOOTSTRAP_PASSWORD='a-unique-password-of-12-or-more-characters' \
BOOTSTRAP_ROLE=operator \
npm run admin:bootstrap
```

Run the API and web development server in separate terminals:

```bash
npm run dev:server
npm run dev:web
```

The web UI is at `http://127.0.0.1:3000`; Vite proxies `/api` to port 3001. Setup never migrates, seeds, resets, kills a process, or creates a user automatically. Bootstrap refuses to overwrite or promote an existing user.

## Provider ingestion contract

Register the custody boundary with `POST /api/v1/source-accounts`. Provider batches use:

```text
POST /api/v1/provider-ingestions/<provider-id>
x-cashflow-timestamp: 2026-07-19T12:00:00.000Z
x-cashflow-signature: HMAC_SHA256(PROVIDER_WEBHOOK_SECRET, timestamp + "." + rawJsonBody)
```

The JSON body contains `sourceAccountId`, `idempotencyKey`, `sourceAsOf`, `entries`, and optional `marketSnapshots`. Money is represented as integer minor units and quantities as millionths. Batches and CSV imports are capped at 1,000 records; request bodies are capped at 1 MB. Webhooks expire after five minutes.

Service clients authenticate with a bearer `OPERATOR_API_TOKEN` or `AUDITOR_API_TOKEN` plus a bounded `x-actor-id`. Browser users receive an eight-hour HttpOnly, SameSite=Strict session and must send the returned CSRF token on mutations.

## Main API routes

- `GET /api/v1/ledger` — authenticated ledger view
- `POST /api/v1/manual-transactions` and `/manual-imports` — governed manual additions
- `POST /api/v1/ledger/:id/corrections` — reversal/replacement correction
- `POST /api/v1/reconciliations` — source-to-ledger reconciliation
- `POST /api/v1/paper/orders` — deterministic paper-order decision
- `POST /api/v1/paper/orders/:id/review` and `/fills` — independent review and idempotent partial fills
- `POST /api/v1/controls/kill-switch/*` — immediate stop and two-person release
- `POST /api/v1/paper/simulations` — stale, duplicate, partial-fill, provider-failure, and limit scenarios
- `GET /api/v1/audit-export` — verified evidence export

There is no live-order endpoint. Startup rejects `LIVE_TRADING_ENABLED=true`.

## Validation

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
npm run security:audit
```

CI repeats clean dependency installation, full-history secret scanning, two migration deploys, static checks, unit/integration/browser tests, production build, dependency audit, and a container build. See [OPERATIONS.md](./OPERATIONS.md) and [SECURITY.md](./SECURITY.md) before release.
