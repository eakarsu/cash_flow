import { useState, useEffect } from 'react';
import AICashFlowService, { CashFlowPrediction } from '../services/aiCashFlowService';
import { Transaction } from '../types';

interface UseAICashFlowOptions {
  apiKey?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useAICashFlow(
  transactions: Transaction[], 
  currentBalance: number,
  options: UseAICashFlowOptions = {}
) {
  const [prediction, setPrediction] = useState<CashFlowPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { apiKey, autoRefresh = false, refreshInterval = 300000 } = options; // 5 minutes default

  const aiService = apiKey ? new AICashFlowService(apiKey) : null;

  const fetchPrediction = async (force = false) => {
    if (!aiService) {
      setError('AI API key not configured');
      return;
    }

    if (loading && !force) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiService.getPredictions(transactions, currentBalance);
      setPrediction(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get AI predictions');
      console.error('AI prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrediction = () => fetchPrediction(true);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && aiService && !loading) {
      const interval = setInterval(() => {
        fetchPrediction();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, aiService, loading]);

  // Initial fetch when dependencies change
  useEffect(() => {
    if (aiService && transactions.length > 0) {
      fetchPrediction();
    }
  }, [transactions.length, currentBalance, apiKey]);

  return {
    prediction,
    loading,
    error,
    lastUpdated,
    refreshPrediction,
    isConfigured: !!aiService
  };
}
