// Apply pass 5 — server-side AI endpoints for cash_flow.
//
// Mounted at /api/ai. All endpoints gate on OPENROUTER_API_KEY and return
// HTTP 503 + { missing: 'OPENROUTER_API_KEY' } when unset, so the FE can
// render an "AI not configured" state instead of a generic 500.
//
// SECURITY-DECISION: this file is the server-side counterpart to the existing
// browser-side AI services in `src/services/aiCashFlowService.ts` etc. The
// project's `_AUDIT_NOTE.md` flagged that the browser side ships the API
// key to the client, which is a separate security concern. This file is
// ADDITIVE — it does NOT change browser-side behavior — and gives backend
// callers a path that keeps OPENROUTER_API_KEY server-only.
//
// Env vars consumed:
//   - OPENROUTER_API_KEY (required; otherwise 503)
//   - OPENROUTER_MODEL   (optional; default anthropic/claude-3-5-sonnet-20241022)
//   - APP_URL            (optional; HTTP-Referer header)
//
// PRODUCT-DECISION: heuristic categorization fallback when AI unavailable
// uses simple keyword rules (rent, payroll, fuel, etc.). Real category
// taxonomy should be product-defined.

import express from 'express';

const router = express.Router();

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function callOR(systemPrompt, userMessage, opts = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    return { error: 'OPENROUTER_API_KEY not configured' };
  }
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Cash Flow Manager',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: opts.maxTokens || 1200,
        temperature: opts.temperature ?? 0.3,
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      return { error: `OpenRouter ${r.status}: ${txt.slice(0, 300)}` };
    }
    const data = await r.json();
    if (data.error) return { error: data.error.message || 'AI error' };
    return { content: data.choices?.[0]?.message?.content, model: data.model };
  } catch (e) {
    return { error: e.message };
  }
}

function require503(res, err) {
  if (err && err.includes('OPENROUTER_API_KEY')) {
    res.status(503).json({ error: 'AI not configured', missing: 'OPENROUTER_API_KEY' });
    return true;
  }
  return false;
}

// POST /api/ai/forecast — produce a short cash-flow forecast narrative.
router.post('/forecast', async (req, res) => {
  try {
    const { transactions = [], horizon_days = 30, currency = 'USD' } = req.body || {};
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions[] required' });
    }
    const totals = transactions.reduce((acc, t) => {
      const amt = Number(t.amount) || 0;
      if (amt >= 0) acc.in += amt; else acc.out += -amt;
      return acc;
    }, { in: 0, out: 0 });
    const net = totals.in - totals.out;

    const result = await callOR(
      'You are a financial analyst producing a short cash-flow forecast. Output STRICT JSON only.',
      `Recent ${transactions.length} transactions: in=${totals.in.toFixed(2)} out=${totals.out.toFixed(2)} net=${net.toFixed(2)} ${currency}.\nHorizon: ${horizon_days} days.\nReturn {"projected_net": number, "confidence": "low|medium|high", "narrative": string, "drivers": [string], "risks": [string]}.`
    );
    if (result.error) {
      if (require503(res, result.error)) return;
      return res.status(502).json({ error: result.error });
    }
    res.json({ totals, horizon_days, ai: result.content, model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/categorize-transactions — bulk categorize.
router.post('/categorize-transactions', async (req, res) => {
  try {
    const { transactions = [] } = req.body || {};
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions[] required' });
    }
    if (transactions.length > 100) {
      return res.status(400).json({ error: 'maximum 100 transactions per request' });
    }
    const result = await callOR(
      'You are a bookkeeping assistant. Categorize each transaction into a standard small-business category. JSON only.',
      `Transactions: ${JSON.stringify(transactions.slice(0, 100))}\nReturn {"categories": [{"id": <id-or-index>, "category": string, "confidence": 0..1, "reason": string}]}.`,
      { maxTokens: 2000 }
    );
    if (result.error) {
      if (require503(res, result.error)) return;
      // Heuristic fallback — keyword-based.
      const fallback = transactions.map((t, i) => {
        const desc = String(t.description || t.memo || '').toLowerCase();
        let cat = 'other';
        if (/rent|lease/.test(desc)) cat = 'rent';
        else if (/payroll|salary|wage/.test(desc)) cat = 'payroll';
        else if (/fuel|gas station|shell|chevron/.test(desc)) cat = 'fuel';
        else if (/uber|lyft|taxi|airline|hotel/.test(desc)) cat = 'travel';
        else if (/aws|gcp|azure|stripe|github/.test(desc)) cat = 'software';
        else if (/grocery|restaurant|food/.test(desc)) cat = 'meals';
        return { id: t.id ?? i, category: cat, confidence: 0.5, reason: 'heuristic_keyword' };
      });
      return res.status(502).json({ error: result.error, fallback_categories: fallback });
    }
    res.json({ ai: result.content, model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/anomaly-detect — flag unusual cash-flow events.
router.post('/anomaly-detect', async (req, res) => {
  try {
    const { transactions = [], baseline_window = 30 } = req.body || {};
    if (!Array.isArray(transactions) || transactions.length < 5) {
      return res.status(400).json({ error: 'transactions[] with >=5 items required' });
    }
    // Local anomaly pre-pass: amounts > 3x median are candidates.
    const amounts = transactions.map(t => Math.abs(Number(t.amount) || 0)).filter(Number.isFinite).sort((a, b) => a - b);
    const median = amounts.length ? amounts[Math.floor(amounts.length / 2)] : 0;
    const candidates = transactions
      .map((t, i) => ({ idx: i, t, mag: Math.abs(Number(t.amount) || 0) }))
      .filter(x => median > 0 && x.mag > median * 3)
      .slice(0, 50);

    const result = await callOR(
      'You are a fraud/anomaly analyst for SMB cash-flow. Output STRICT JSON only.',
      `Median magnitude: ${median.toFixed(2)}. Candidates (>3x median): ${JSON.stringify(candidates)}.\nBaseline window: ${baseline_window} days.\nReturn {"anomalies": [{"id": any, "severity": "low|medium|high", "reason": string, "next_step": string}], "overall_risk": "low|medium|high", "summary": string}.`
    );
    if (result.error) {
      if (require503(res, result.error)) return;
      return res.status(502).json({
        error: result.error,
        local_candidates: candidates.map(c => ({ id: c.t.id ?? c.idx, magnitude: c.mag })),
      });
    }
    res.json({ median, candidates_count: candidates.length, ai: result.content, model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
