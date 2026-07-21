import React, { useRef, useState } from "react";
import { ArrowLeft, FileCheck2, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "../../context/TransactionContext";
import { parseCSV } from "../../utils/csvParser";

export default function ImportTransactionsPage() {
  const navigate = useNavigate();
  const input = useRef<HTMLInputElement>(null);
  const { replaceAllTransactions } = useTransactions();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const importFile = async (file: File) => {
    setBusy(true); setStatus(null);
    try {
      const transactions = await parseCSV(file);
      await replaceAllTransactions(transactions);
      setStatus(`${transactions.length} transactions appended to the governed ledger. Existing entries were not deleted.`);
      setTimeout(() => navigate("/transactions"), 1_000);
    } catch (cause) { setStatus(cause instanceof Error ? cause.message : "Import failed."); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-3xl px-4 py-10">
    <button onClick={() => navigate("/transactions")} className="mb-5 inline-flex items-center text-sm text-gray-600"><ArrowLeft className="mr-1 h-4 w-4" />Back to transactions</button>
    <section className="rounded-xl border bg-white p-8 shadow-sm">
      <FileCheck2 className="mb-4 h-10 w-10 text-blue-600" />
      <h1 className="text-3xl font-bold">Governed CSV ingestion</h1>
      <p className="mt-3 text-gray-600">Imports are additive and idempotent. Dates and amounts are validated; rows are capped at 1,000. Corrections use append-only reversals.</p>
      <input ref={input} className="sr-only" type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); }} />
      <button disabled={busy} onClick={() => input.current?.click()} className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50"><Upload className="mr-2 h-5 w-5" />{busy ? "Validating and importing…" : "Choose CSV"}</button>
      {status && <p role="status" className="mt-5 rounded-lg bg-slate-100 p-4 text-sm">{status}</p>}
    </section>
  </main>;
}
