import React, { createContext, useContext, useMemo, useState } from "react";

interface CashFlowPrediction {
  weeklyForecasts: Array<{ week: string; projectedBalance: number; inflows: number; outflows: number; optimistic: number; realistic: number; pessimistic: number }>;
  runwayAnalysis: { currentRunway: number; projectedRunway: number; burnRate: number; recommendations: string[] };
  categoryInsights: Array<{ category: string; trend: "increasing" | "decreasing" | "stable"; projectedAmount: number; riskLevel: "low" | "medium" | "high" }>;
  summary: { overallTrend: "positive" | "negative" | "stable"; keyInsights: string[]; actionItems: string[] };
}

interface AdvisoryContext {
  prediction: CashFlowPrediction | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshPrediction: () => void;
  isConfigured: boolean;
  useAI: boolean;
  setUseAI: (enabled: boolean) => void;
}

const Context = createContext<AdvisoryContext | undefined>(undefined);

export function AICashFlowProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const value = useMemo<AdvisoryContext>(() => ({
    prediction: null,
    loading: false,
    error,
    lastUpdated: null,
    refreshPrediction: () => setError("AI advice is disabled. Forecasts are deterministic and cannot approve or place orders."),
    isConfigured: false,
    useAI: false,
    setUseAI: (enabled: boolean) => { if (enabled) setError("AI cannot participate in financial control decisions."); },
  }), [error]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAICashFlowContext() {
  const context = useContext(Context);
  if (!context) throw new Error("useAICashFlowContext must be used within AICashFlowProvider");
  return context;
}
