import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTransactions } from './TransactionContext';
import AICashFlowService, { CashFlowPrediction } from '../services/aiCashFlowService';

interface AICashFlowContextType {
  prediction: CashFlowPrediction | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshPrediction: () => void;
  isConfigured: boolean;
  useAI: boolean;
  setUseAI: (enabled: boolean) => void;
}

const AICashFlowContext = createContext<AICashFlowContextType | undefined>(undefined);

interface AICashFlowProviderProps {
  children: ReactNode;
}

export const AICashFlowProvider: React.FC<AICashFlowProviderProps> = ({ children }) => {
  const { transactions } = useTransactions();
  const [prediction, setPrediction] = useState<CashFlowPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [useAI, setUseAI] = useState(false);

  // Get API key from environment
  const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY;
  const isConfigured = !!apiKey;
  const aiService = apiKey ? new AICashFlowService(apiKey) : null;

  // Get current balance
  const currentBalance = transactions.length > 0 ? 
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].balance || 0 : 0;

  const fetchPrediction = async (force = false) => {
    if (!aiService || !apiKey) {
      console.log('⚠️ AI Service not configured - no API key provided');
      setError(null);
      setPrediction(null);
      return;
    }

    if (loading && !force) {
      console.log('🔄 Already loading, skipping duplicate request');
      return;
    }

    console.log('🚀 Starting centralized AI prediction fetch...');
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.getPredictions(transactions, currentBalance);
      console.log('✅ Centralized AI prediction successful:', result);
      setPrediction(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ Centralized AI prediction error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI predictions');
    } finally {
      setLoading(false);
    }
  };

  const refreshPrediction = () => fetchPrediction(true);

  // Auto-refresh effect when AI is enabled
  useEffect(() => {
    if (useAI && isConfigured && aiService && transactions.length > 0) {
      console.log('🔄 AI enabled, fetching centralized predictions');
      fetchPrediction();
    }
  }, [useAI, transactions.length, currentBalance, isConfigured]);

  // Auto-refresh interval when AI is enabled
  useEffect(() => {
    if (useAI && isConfigured && !loading) {
      const interval = setInterval(() => {
        console.log('⏰ Auto-refresh interval triggered');
        fetchPrediction();
      }, 300000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [useAI, isConfigured, loading]);

  const value: AICashFlowContextType = {
    prediction,
    loading,
    error,
    lastUpdated,
    refreshPrediction,
    isConfigured,
    useAI,
    setUseAI
  };

  return (
    <AICashFlowContext.Provider value={value}>
      {children}
    </AICashFlowContext.Provider>
  );
};

export const useAICashFlowContext = () => {
  const context = useContext(AICashFlowContext);
  if (context === undefined) {
    throw new Error('useAICashFlowContext must be used within an AICashFlowProvider');
  }
  return context;
};
