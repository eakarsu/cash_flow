import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { authenticated, error, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (authenticated) return <Navigate to="/" replace />;
  return <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
    <form className="mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl" onSubmit={async (event) => {
      event.preventDefault(); setSubmitting(true); try { await login(email, password); } catch { /* context renders the generic error */ } finally { setSubmitting(false); }
    }}>
      <ShieldCheck className="mb-5 h-10 w-10 text-blue-400" aria-hidden="true" />
      <h1 className="text-2xl font-bold">Cash operations sign in</h1>
      <p className="mt-2 text-sm text-slate-300">Access is limited to bootstrapped operators and auditors. Live trading is not supported.</p>
      <label className="mt-6 block text-sm font-medium" htmlFor="login-email">Email</label>
      <input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" />
      <label className="mt-4 block text-sm font-medium" htmlFor="login-password">Password</label>
      <input id="login-password" type="password" autoComplete="current-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" />
      {error && <p role="alert" className="mt-4 rounded bg-red-950 p-3 text-sm text-red-200">{error}</p>}
      <button disabled={submitting} className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:opacity-60">{submitting ? "Signing in…" : "Sign in"}</button>
    </form>
  </main>;
}
