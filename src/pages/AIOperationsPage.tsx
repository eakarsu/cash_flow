import AdvisoryWorkspace from '../components/runtime-ai/AdvisoryWorkspace';
import { useAuth } from '../context/AuthContext';

const examples = [
  { label: 'Cash runway review', value: 'Review a cash-runway planning process. No ledger totals are supplied. Identify the verified cash balances, receivables aging, committed expenses and review dates needed before estimating runway. Provide a concise executive summary, an evidence checklist, key uncertainty and three auditable human-review steps. Do not invent balances or execute a financial action.' },
  { label: 'Reconciliation controls', value: 'Prepare a cash-flow reconciliation control review using this process brief: an operator imports approved bank records, compares source account balances with ledger entries and routes discrepancies for independent review. No discrepancy amounts or transaction IDs are supplied. Explain the evidence needed, segregation-of-duty checks, unresolved-risk register and an audit-ready follow-up plan. Do not claim any correction has been made.' },
  { label: 'Liquidity risk briefing', value: 'Draft a liquidity-risk review plan for a team that monitors cash inflows, committed outflows and paper-only operational scenarios. No portfolio positions or current exposure values are supplied. Include a professional summary, data-quality checks, conservative scenario assumptions, escalation criteria and owner-by-owner next steps for human approval. Do not provide a fabricated risk score or imply that trading or transfers are enabled.' },
];

export default function AIOperationsPage() {
  const { csrfToken, role } = useAuth();
  return <AdvisoryWorkspace title="Cash-flow AI Operations" description="Prepare a complete brief and receive a professional OpenRouter report. Saved reports retain their original evidence; operational changes use the existing approval controls." endpoint="/api/runtime-ai/cashflow-advice" field="prompt" fieldLabel="Operations brief" maxLength={8000} minLength={1} examples={examples} requestHeaders={csrfToken ? { 'x-csrf-token': csrfToken } : {}} canGenerate={role === 'operator'}/>;
}
