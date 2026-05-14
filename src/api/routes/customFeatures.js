// Custom feature endpoints (batch_09 audit suggestions)
// ESM Express router. Backend-only — keeps OPENROUTER_API_KEY off the client.
import express from 'express';

const router = express.Router();
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function callLLM(system, user, { maxTokens = 1500, temperature = 0.3 } = {}) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY missing');
    e.statusCode = 503;
    throw e;
  }
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      max_tokens: maxTokens,
      temperature,
    }),
  });
  const data = await r.json();
  return { content: data?.choices?.[0]?.message?.content || '', model: data?.model };
}

function parseJSON(t) {
  if (!t) return null;
  const c = String(t).replace(/```(?:json)?/gi, '').replace(/```/g, '');
  const m = c.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

function err(res, e, label) {
  if (e.statusCode === 503) return res.status(503).json({ error: e.message, missing: 'OPENROUTER_API_KEY' });
  console.error(`${label} error:`, e.message);
  res.status(500).json({ error: e.message });
}

// 1. Vendor / customer aging dashboards
router.post('/aging-dashboard', async (req, res) => {
  try {
    const { invoices } = req.body || {};
    if (!Array.isArray(invoices)) return res.status(400).json({ error: 'invoices array required' });
    const ai = await callLLM(
      'You bucket AR/AP invoices into aging windows and surface concentration risk. JSON only.',
      `INVOICES: ${JSON.stringify(invoices.slice(0, 100))}\nReturn JSON {"aging_buckets":[{"label":"current|30|60|90|over90","amount_usd":0,"count":0}],"top_overdue":[{"counterparty":"","amount_usd":0,"days_overdue":0}],"concentration_risk":"low|med|high"}`
    );
    res.json({ type: 'aging-dashboard', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'aging-dashboard'); }
});

// 2. Predictive shortfall alerts and credit-line suggestions
router.post('/shortfall-alerts', async (req, res) => {
  try {
    const { cash_balance_usd, upcoming_outflows, upcoming_inflows, threshold_usd = 0 } = req.body || {};
    if (cash_balance_usd == null) return res.status(400).json({ error: 'cash_balance_usd required' });
    const ai = await callLLM(
      'You predict cash shortfalls and recommend credit-line draws. JSON only.',
      `BALANCE_USD: ${cash_balance_usd}\nOUTFLOWS: ${JSON.stringify(upcoming_outflows || [])}\nINFLOWS: ${JSON.stringify(upcoming_inflows || [])}\nTHRESHOLD_USD: ${threshold_usd}\nReturn JSON {"shortfall_dates":[{"date":"","projected_balance":0,"gap_usd":0}],"recommended_draw_usd":0,"suggested_actions":[""],"confidence":0}`
    );
    res.json({ type: 'shortfall-alerts', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'shortfall-alerts'); }
});

// 3. Smart bill scheduling to optimize float
router.post('/bill-scheduling', async (req, res) => {
  try {
    const { bills, cash_forecast } = req.body || {};
    if (!Array.isArray(bills)) return res.status(400).json({ error: 'bills array required' });
    const ai = await callLLM(
      'You schedule bill payments to maximize float without late fees. JSON only.',
      `BILLS: ${JSON.stringify(bills.slice(0, 60))}\nCASH_FORECAST: ${JSON.stringify(cash_forecast || {})}\nReturn JSON {"schedule":[{"bill_id":"","pay_on":"","reason":""}],"projected_float_gain_usd":0,"late_fees_avoided_usd":0,"warnings":[""]}`
    );
    res.json({ type: 'bill-scheduling', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'bill-scheduling'); }
});

// 4. Tax-prep export pack with categorized exports
// TODO: configure credentials for TAX_PROVIDER_API_KEY (TurboTax/Avalara) for direct export.
router.post('/tax-prep-pack', async (req, res) => {
  try {
    const { fiscal_year, transactions } = req.body || {};
    if (!fiscal_year) return res.status(400).json({ error: 'fiscal_year required' });
    const ai = await callLLM(
      `You assemble a tax-prep pack from categorized transactions. Provider API: ${Boolean(process.env.TAX_PROVIDER_API_KEY)}. JSON only.`,
      `YEAR: ${fiscal_year}\nTX_SAMPLE: ${JSON.stringify((transactions || []).slice(0, 80))}\nReturn JSON {"category_summary":[{"category":"","total_usd":0,"tx_count":0}],"schedule_c_mappings":[{"line":"","amount_usd":0}],"deduction_flags":[""],"missing_documentation":[""]}`,
      { maxTokens: 1800 }
    );
    res.json({ type: 'tax-prep-pack', result: parseJSON(ai.content) || { raw: ai.content }, model: ai.model });
  } catch (e) { err(res, e, 'tax-prep-pack'); }
});

export default router;
