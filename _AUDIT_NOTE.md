# Audit Note — cash_flow

**Bucket:** A. DETECTOR_FALSE_POSITIVE

**Date:** 2026-05-06

## Detection Result vs. Reality

The original audit (`/Users/erolakarsu/projects/_AUDIT/reports/batch_09.md`) classified `cash_flow` as
"Node. 0 routes, 0 AI. Has node_modules. Verdict: Skeleton". This classification is **incorrect** —
the project is a substantive React/TypeScript SPA with a Node/Express backend (`server.ts`), a custom
OpenRouter LLM client, and dedicated AI services for cash-flow analysis and column mapping.

## LLM References Found (whole-project scan)

The repo-wide scan for `openrouter|openai|anthropic|claude|chat/completions` (excluding
`node_modules/.next/.git/dist/build`) returned the following hits:

- `src/services/OpenRouterService.ts` — central OpenRouter chat client
- `src/services/aiCashFlowService.ts` — AI cash-flow analysis service
- `src/services/aiColumnMappingService.ts` — AI column-mapping service for CSV imports
- `src/context/AICashFlowContext.tsx` — React context for AI features
- `src/hooks/useAICashFlow.ts` — React hook for AI cash-flow features
- `src/components/Settings/AIConfigModal.tsx` — settings modal for AI configuration
- `src/pages/Settings/SettingsPage.tsx` — settings page surfacing AI config

## Source Counts

- 94 `.js`/`.ts`/`.tsx`/`.jsx`/`.py` source files (excluding `node_modules`, `.next`, `dist`, `build`).
- Top-level Express server entry: `server.ts`.
- Internal API routes under `src/api/routes/`.
- Component tree under `src/components/{Settings,Layout,Dashboard,TransactionManager,common,SEO}`.

## Conclusion

`cash_flow` is **not** a skeleton. It is a working React + Express + OpenRouter cash-flow application.
No scaffolding is required. No code changes were made.

## Genuinely Missing Audit Recommendations

The original audit report did not enumerate AI endpoints because the detector apparently scanned only
`backend/routes/*.js` patterns and missed this project's `services/`-based architecture. Items that
remain genuinely worth pursuing if the owner wants to extend AI surface area:

- A dedicated `/api/ai/forecast` endpoint that wraps `aiCashFlowService` for headless callers.
- A dedicated `/api/ai/categorize-transactions` endpoint for bulk transaction categorization.
- A dedicated `/api/ai/anomaly-detect` endpoint for unusual cash-flow events.

These are enhancements, not gaps that warrant scaffolding.

## Apply pass — implemented

Nothing was modified. The AI services in `src/services/` are designed for the React-side runtime and use the OpenRouter key from frontend config. Porting them to the Express `server.ts` route layer would require:

- Splitting `OpenRouterService.ts` into a server-safe variant (no `import.meta.env`, no React-context coupling).
- Auditing whether AI keys should be exposed to the browser (probably not — current frontend usage suggests they currently are, which is a separate security concern).
- Adding a new `src/api/routes/ai.ts` and registering it in `server.ts`.

That's not mechanical — it touches a security/architecture decision (where do API keys live?). Left in backlog.

## Backlog (prioritized)

1. [SECURITY-DECISION] Move OpenRouter calls from browser to server. Required before adding `/api/ai/*` endpoints, otherwise we're shipping API keys to the client.
2. [PRODUCT-DECISION] After (1), add `/api/ai/forecast`, `/api/ai/categorize-transactions`, `/api/ai/anomaly-detect`.
3. [HOUSEKEEPING] Many root-level scratch files (`build_prompt.txt`, `files.txt`, multiple CSV samples, `package.json.bak`, `package.json.backup`) should move to a scratch dir.

## Files touched in this pass

- `/Users/erolakarsu/projects/cash_flow/_AUDIT_NOTE.md` (this file).

No source files were modified. Syntax: N/A.

## Apply pass 3 (frontend)

- **Stack:** React/TS SPA + Express (`server.ts`); AI in `src/services/` runs browser-side.
- **Backend endpoints in scope:** none. `server.ts` mounts only `contact`, `export`, `quickbooks`, `upload`, `transactions` — no `/api/ai/*` routes exist.
- **Action:** SKIPPED-NO-DOMAIN.
- **Notes:** No backend AI endpoint to wire a FE form to. Adding such endpoints is gated on the SECURITY-DECISION already in this project's backlog (move OpenRouter calls from browser to server before exposing `/api/ai/*`). Nothing actionable for a frontend pass.
- **Files written/modified:** none.
