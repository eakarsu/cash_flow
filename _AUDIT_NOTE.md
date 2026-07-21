# Audit Note — cash_flow

The 2026-05-06 detector note is superseded by the governed implementation completed on 2026-07-19.

The supported production runtime is `server.ts` plus `src/server/**`; it provides authenticated, ledger-backed cash operations and paper-only deterministic risk controls. Legacy experimental routes and browser-side OpenRouter source files are not compiled or mounted. The shipped browser bundle contains no OpenRouter client, API-key configuration, AI decision path, fake seed data, or live execution path.

Do not restore the old recommendation to expose `/api/ai/*` endpoints without a separate privacy, evaluation, output-schema, cost, timeout, rate-limit, and human-review design. AI must never participate in source ingestion, reconciliation, exposure/liquidity/loss limits, approval, kill-switch operation, custody, or execution.

Current validation and external launch blockers are recorded in `_COMPLETENESS_REVIEW.md`, `SECURITY.md`, `SECURITY_INCIDENT.md`, and `OPERATIONS.md`.
