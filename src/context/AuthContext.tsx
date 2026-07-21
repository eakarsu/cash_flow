import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  role: "operator" | "auditor" | null;
  csrfToken: string | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function responseError(response: Response): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return body?.error?.message || `Request failed (${response.status})`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AuthState["role"]>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "same-origin" }).then(async (response) => {
      if (!response.ok) return;
      const session = await response.json();
      setAuthenticated(true);
      setRole(session.role);
      setCsrfToken(session.csrfToken);
    }).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const response = await fetch("/api/auth/login", {
      method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }),
    });
    if (!response.ok) { const message = await responseError(response); setError(message); throw new Error(message); }
    const session = await response.json();
    setAuthenticated(true);
    setRole(session.role);
    setCsrfToken(session.csrfToken);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin", headers: csrfToken ? { "x-csrf-token": csrfToken } : {} });
    setAuthenticated(false); setRole(null); setCsrfToken(null);
  }, [csrfToken]);

  const value = useMemo(() => ({ authenticated, loading, role, csrfToken, error, login, logout }), [authenticated, loading, role, csrfToken, error, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
