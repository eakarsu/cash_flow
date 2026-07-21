import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Transaction } from "../types";
import { useAuth } from "./AuthContext";

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => never;
  replaceAllTransactions: (transactions: Transaction[]) => Promise<void>;
  resetAppState: () => never;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

function toTransaction(row: Record<string, any>): Transaction {
  const metadata = typeof row.metadata_json === "string" ? JSON.parse(row.metadata_json) : {};
  const amount = Number(row.amount_minor) / 100;
  return {
    id: String(row.id), date: String(row.occurred_at).slice(0, 10), amount, description: String(row.description),
    category: String(metadata.category || row.event_type || "Uncategorized"), type: amount >= 0 ? "inflow" : "outflow",
    merchant: metadata.merchant ? String(metadata.merchant) : undefined, paymentRef: String(row.external_id),
  };
}

async function checked(response: Response) {
  if (response.ok) return response.json().catch(() => ({}));
  const body = await response.json().catch(() => ({}));
  throw new Error(body?.error?.message || `Request failed (${response.status})`);
}

function ledgerInput(transaction: Omit<Transaction, "id"> | Transaction, externalId: string) {
  const occurredAt = new Date(`${transaction.date}T12:00:00.000Z`).toISOString();
  return {
    externalId, sourceVersion: 1, occurredAt, sourceTimestamp: new Date().toISOString(), currency: "USD",
    amountMinor: Math.round(transaction.amount * 100), description: transaction.description,
    metadata: { category: transaction.category, merchant: transaction.merchant || null, paymentRef: transaction.paymentRef || null },
  };
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, csrfToken, role } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headers = useCallback(() => ({ "content-type": "application/json", ...(csrfToken ? { "x-csrf-token": csrfToken } : {}) }), [csrfToken]);

  const refreshTransactions = useCallback(async () => {
    if (!authenticated) { setTransactions([]); return; }
    setLoading(true); setError(null);
    try {
      const response = await checked(await fetch("/api/v1/ledger?limit=1000", { credentials: "same-origin" }));
      setTransactions((response.data || []).map(toTransaction));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load ledger"); }
    finally { setLoading(false); }
  }, [authenticated]);

  useEffect(() => { void refreshTransactions(); }, [refreshTransactions]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, "id">) => {
    if (role !== "operator") throw new Error("Operator role required.");
    await checked(await fetch("/api/v1/manual-transactions", { method: "POST", credentials: "same-origin", headers: headers(),
      body: JSON.stringify({ ...ledgerInput(transaction, `manual:${crypto.randomUUID()}`), idempotencyKey: `manual:${crypto.randomUUID()}` }) }));
    await refreshTransactions();
  }, [headers, refreshTransactions, role]);

  const updateTransaction = useCallback(async (id: string, transaction: Omit<Transaction, "id">) => {
    if (role !== "operator") throw new Error("Operator role required.");
    const now = new Date().toISOString();
    await checked(await fetch(`/api/v1/ledger/${encodeURIComponent(id)}/corrections`, { method: "POST", credentials: "same-origin", headers: headers(),
      body: JSON.stringify({ correctionId: `ui:${crypto.randomUUID()}`, reason: "Operator correction through governed edit form", corrected: { ...ledgerInput(transaction, "unused"), sourceTimestamp: now } }) }));
    await refreshTransactions();
  }, [headers, refreshTransactions, role]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (role !== "operator") throw new Error("Operator role required.");
    await checked(await fetch(`/api/v1/ledger/${encodeURIComponent(id)}/corrections`, { method: "POST", credentials: "same-origin", headers: headers(),
      body: JSON.stringify({ correctionId: `reverse:${crypto.randomUUID()}`, reason: "Operator reversal through governed transaction list" }) }));
    await refreshTransactions();
  }, [headers, refreshTransactions, role]);

  const replaceAllTransactions = useCallback(async (incoming: Transaction[]) => {
    if (role !== "operator") throw new Error("Operator role required.");
    const batch = crypto.randomUUID();
    await checked(await fetch("/api/v1/manual-imports", { method: "POST", credentials: "same-origin", headers: headers(),
      body: JSON.stringify({ idempotencyKey: `csv:${batch}`, entries: incoming.map((entry, index) => ledgerInput(entry, `csv:${batch}:${index + 1}`)) }) }));
    await refreshTransactions();
  }, [headers, refreshTransactions, role]);

  const forbidden = () => { throw new Error("Destructive clearing is disabled. Use an audited reversal or correction."); };
  const value = useMemo(() => ({ transactions, loading, error, refreshTransactions, addTransaction, updateTransaction, deleteTransaction,
    clearAllTransactions: forbidden, replaceAllTransactions, resetAppState: forbidden, setTransactions }),
    [transactions, loading, error, refreshTransactions, addTransaction, updateTransaction, deleteTransaction, replaceAllTransactions]);
  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransactions must be used within TransactionProvider");
  return context;
}
