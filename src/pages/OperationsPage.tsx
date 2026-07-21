import React, { useCallback, useEffect, useState } from "react";
import { AlertOctagon, FileDown, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function OperationsPage() {
  const { role, csrfToken } = useAuth();
  const [snapshot, setSnapshot] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setError(null);
    const response = await fetch("/api/v1/operations");
    if (!response.ok) { setError("Unable to load operational controls."); return; }
    setSnapshot(await response.json());
  }, []);
  useEffect(() => { void load(); }, [load]);
  const activate = async () => {
    const reason = window.prompt("Document the incident reason for activating the kill switch:");
    if (!reason) return;
    const response = await fetch("/api/v1/controls/kill-switch/activate", { method: "POST", headers: { "content-type": "application/json", ...(csrfToken ? { "x-csrf-token": csrfToken } : {}) }, body: JSON.stringify({ reason }) });
    if (!response.ok) setError("Kill-switch activation failed."); else await load();
  };
  if (error) return <div role="alert" className="rounded-lg bg-red-50 p-6 text-red-800">{error}</div>;
  if (!snapshot) return <p>Loading governed operations…</p>;
  const control = snapshot.control || {};
  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold text-gray-900">Governed operations</h1><p className="text-gray-600">Deterministic limits and paper execution only.</p></div>
      <button onClick={() => void load()} className="inline-flex items-center rounded border px-3 py-2"><RefreshCw className="mr-2 h-4 w-4" />Refresh</button>
    </header>
    <section className={`rounded-xl border p-6 ${control.kill_switch_active ? "border-red-400 bg-red-50" : "border-green-300 bg-green-50"}`}>
      <div className="flex items-center"><AlertOctagon className="mr-3 h-6 w-6" /><h2 className="text-xl font-semibold">Kill switch: {control.kill_switch_active ? "ACTIVE" : "inactive"}</h2></div>
      <p className="mt-2 text-sm">{control.reason || "New paper orders are evaluated against the checked-in risk policy."}</p>
      {role === "operator" && !control.kill_switch_active && <button onClick={activate} className="mt-4 rounded bg-red-700 px-4 py-2 text-white">Activate kill switch</button>}
    </section>
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border bg-white p-5"><ShieldCheck className="mb-3 h-5 w-5" /><h2 className="font-semibold">Gross paper exposure</h2><p className="text-2xl">${(Number(snapshot.portfolio?.gross || 0) / 100).toLocaleString()}</p></div>
      <div className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Ingestion exceptions</h2><p className="text-2xl">{snapshot.ingestionExceptions?.length || 0}</p></div>
      <div className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Reconciliations shown</h2><p className="text-2xl">{snapshot.reconciliation?.length || 0}</p></div>
    </section>
    <section className="rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold">Risk policy</h2><pre className="mt-3 overflow-auto rounded bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(snapshot.policy, null, 2)}</pre></section>
    <a href="/api/v1/audit-export" className="inline-flex items-center rounded bg-slate-900 px-4 py-3 text-white"><FileDown className="mr-2 h-4 w-4" />Download verified audit export</a>
  </div>;
}
