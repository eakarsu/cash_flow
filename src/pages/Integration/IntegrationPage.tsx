import React, { useCallback, useEffect, useState } from "react";
import { DatabaseZap, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function IntegrationPage() {
  const { role, csrfToken } = useAuth();
  const [accounts, setAccounts] = useState<Array<Record<string, any>>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({ provider: "", externalAccountId: "", displayName: "", currency: "USD", custodyClass: "bank", licenseReference: "" });
  const load = useCallback(async () => {
    const response = await fetch("/api/v1/source-accounts");
    if (response.ok) setAccounts((await response.json()).data || []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage(null);
    const response = await fetch("/api/v1/source-accounts", { method: "POST", headers: { "content-type": "application/json", ...(csrfToken ? { "x-csrf-token": csrfToken } : {}) }, body: JSON.stringify(form) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setMessage(body?.error?.message || "Source registration failed.");
    else { setMessage("Licensed source account registered. Provider data must use signed, timestamped ingestion."); await load(); }
  };
  return <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
    <header><DatabaseZap className="mb-3 h-9 w-9 text-blue-600" /><h1 className="text-3xl font-bold">Licensed data sources</h1><p className="mt-2 text-gray-600">Accounts define provider, currency, and custody boundaries. This application never stores bank login credentials.</p></header>
    {role === "operator" && <form onSubmit={submit} className="grid gap-4 rounded-xl border bg-white p-6 md:grid-cols-2">
      <h2 className="md:col-span-2 text-xl font-semibold">Register contracted source</h2>
      <label className="text-sm">Approved provider ID<input required value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
      <label className="text-sm">External account ID<input required value={form.externalAccountId} onChange={e => setForm({ ...form, externalAccountId: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
      <label className="text-sm">Display name<input required value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
      <label className="text-sm">Currency<input required pattern="[A-Za-z]{3}" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} className="mt-1 w-full rounded border p-2" /></label>
      <label className="text-sm">Custody class<select value={form.custodyClass} onChange={e => setForm({ ...form, custodyClass: e.target.value })} className="mt-1 w-full rounded border p-2"><option value="bank">Bank</option><option value="broker">Broker</option></select></label>
      <label className="text-sm">License / contract reference<input required value={form.licenseReference} onChange={e => setForm({ ...form, licenseReference: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>
      <button className="rounded bg-blue-600 px-4 py-3 font-semibold text-white md:col-span-2">Register source boundary</button>
      {message && <p role="status" className="rounded bg-slate-100 p-3 text-sm md:col-span-2">{message}</p>}
    </form>}
    <section className="rounded-xl border bg-white p-6"><h2 className="text-xl font-semibold">Registered sources</h2><div className="mt-4 space-y-3">{accounts.map(account => <article key={account.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-4"><div><strong>{account.display_name}</strong><p className="text-sm text-gray-600">{account.provider} · {account.custody_class} · {account.currency}</p></div><span className="inline-flex items-center text-sm text-green-700"><ShieldCheck className="mr-1 h-4 w-4" />licensed {String(account.licensed_at).slice(0, 10)}</span></article>)}</div></section>
    <section className="rounded-xl bg-slate-950 p-6 text-slate-100"><h2 className="font-semibold">Provider contract</h2><p className="mt-2 text-sm text-slate-300">POST JSON to <code>/api/v1/provider-ingestions/&lt;provider&gt;</code> with an ISO <code>x-cashflow-timestamp</code> and hex HMAC-SHA256 <code>x-cashflow-signature</code> over <code>timestamp.rawBody</code>. Batches require idempotency keys and source timestamps; mismatched duplicates become review exceptions.</p></section>
  </main>;
}
