import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { setImmediate as nextTurn } from 'node:timers/promises';
import type Database from 'better-sqlite3';
import { authorize } from './auth.js';
import type { RuntimeConfig } from './config.js';
import { DEFAULT_WORKSPACE_ID } from './database.js';
import { DomainError } from './ledger.js';

function execution(request: Request, response: Response, timeoutMs: number) {
  const controller = new AbortController();
  const abort = () => controller.abort(new DomainError('ai_cancelled', 'AI request cancelled.', 499));
  const close = () => { if (!response.writableFinished) abort(); };
  request.once('aborted', abort); response.once('close', close);
  if (request.aborted || response.destroyed) abort();
  const timer = setTimeout(() => controller.abort(new DomainError('ai_timeout', 'OpenRouter timed out. Try again.', 504)), timeoutMs);
  return { signal: controller.signal, check: () => controller.signal.throwIfAborted(), dispose() { clearTimeout(timer); request.removeListener('aborted', abort); response.removeListener('close', close); } };
}

export function createRuntimeAiRouter(db: Database.Database, config: RuntimeConfig, options: { timeoutMs?: number } = {}) {
  const router = Router();
  router.get('/cashflow-advice', (request, response, next) => {
    try {
      const actor = authorize(request, db, config, 'auditor');
      const reports = db.prepare(`SELECT id,prompt,content,model,created_at AS createdAt FROM runtime_ai_results
        WHERE workspace_id=? AND actor_id=? ORDER BY created_at DESC,id DESC LIMIT 50`).all(DEFAULT_WORKSPACE_ID, actor.id);
      response.json({ reports });
    } catch (error) { next(error); }
  });
  router.post('/cashflow-advice', async (request, response, next) => {
    const scope = execution(request, response, options.timeoutMs ?? 60_000);
    try {
      const actor = authorize(request, db, config, 'operator', true);
      const value = request.body?.prompt;
      if (typeof value !== 'string' || !value.trim() || value.length > 8000) throw new DomainError('invalid_prompt', 'Enter a prompt of 1–8,000 characters.', 400);
      const prompt = value.trim();
      const apiKey = String(process.env.OPENROUTER_API_KEY || '').trim(), model = String(process.env.OPENROUTER_MODEL || '').trim();
      const baseUrl = String(process.env.OPENROUTER_BASE_URL || '').replace(/\/+$/, '');
      if (!apiKey || !model || baseUrl !== 'https://openrouter.ai/api/v1') throw new DomainError('ai_configuration', 'Configure the OpenRouter key, model and canonical API URL to generate a report.', 503);
      scope.check();
      const providerResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'Cash Flow Manager' },
        body: JSON.stringify({ model, messages: [{ role: 'system', content: 'Provide cash-flow operations advice using only the supplied brief. Clearly state assumptions, evidence gaps, risks and auditable next actions. Write a professional report with headings and concise recommendations. Never invent ledger facts or imply that a trade, transfer, ledger correction or approval was executed.' }, { role: 'user', content: prompt }], temperature: 0.2, max_tokens: 1600 }),
        signal: scope.signal,
      });
      scope.check();
      if (!providerResponse.ok) throw new DomainError('ai_provider', providerResponse.status === 429 ? 'OpenRouter rate limited the request. Try again shortly.' : 'OpenRouter could not complete the request.', providerResponse.status === 429 ? 429 : 502);
      const payload = await providerResponse.json() as any;
      scope.check();
      const choice = payload?.choices?.[0], content = choice?.message?.content;
      if (choice?.message?.refusal || ['length', 'content_filter'].includes(choice?.finish_reason) || typeof content !== 'string' || !content.trim() || content.length > 100_000 || !payload?.id) throw new DomainError('ai_response', 'OpenRouter returned an incomplete or unavailable report. Try again.', 502);
      // Give queued disconnect events a turn before the atomic synchronous SQLite save.
      await nextTurn(); scope.check();
      const id = randomUUID(), createdAt = new Date().toISOString();
      const upstreamModel = String(payload.model || model);
      db.transaction(() => {
        scope.check();
        const fresh = authorize(request, db, config, 'operator', true);
        if (fresh.id !== actor.id) throw new DomainError('authentication_required', 'Your session changed. Sign in again.', 401);
        db.prepare("INSERT INTO runtime_ai_results(id,workspace_id,actor_id,prompt,content,provider,model,created_at) VALUES(?,?,?,?,?,'openrouter',?,?)")
          .run(id, DEFAULT_WORKSPACE_ID, actor.id, prompt, content.trim(), upstreamModel, createdAt);
        scope.check();
        const finalActor = authorize(request, db, config, 'operator', true);
        if (finalActor.id !== actor.id) throw new DomainError('authentication_required', 'Your session changed. Sign in again.', 401);
      }).immediate();
      scope.check();
      response.json({ id, persistedId: id, prompt, content: content.trim(), provider: 'openrouter', model: upstreamModel, createdAt });
    } catch (error) {
      if (response.destroyed || request.aborted) return;
      if (scope.signal.aborted) return next(scope.signal.reason);
      if (error instanceof DomainError) return next(error);
      next(new DomainError('ai_provider', 'OpenRouter could not complete the request. Check the connection and try again.', 502));
    } finally { scope.dispose(); }
  });
  return router;
}
