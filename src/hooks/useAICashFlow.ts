import { useState, useEffect } from 'react';
import AICashFlowService, { CashFlowPrediction } from '../services/aiCashFlowService.ts';
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
      console.log('⚠️ AI Service not configured - no API key provided');
      setError('AI API key not configured');
      return;
    }

    if (loading && !force) return;

    console.log('🚀 Starting AI prediction fetch...');
    setLoading(true);
    setError(null);

    try {
      const result = await aiService.getPredictions(transactions, currentBalance);
      console.log('✅ AI prediction successful:', result);
      setPrediction(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ AI prediction hook error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get AI predictions');
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
    console.log('🔍 useAICashFlow effect triggered:', {
      hasAiService: !!aiService,
      transactionCount: transactions.length,
      currentBalance,
      apiKey: apiKey ? 'SET' : 'NOT SET',
      autoRefresh: autoRefresh
    });
    
    if (aiService && transactions.length > 0 && autoRefresh) {
      console.log('✅ Conditions met, calling fetchPrediction');
      fetchPrediction();
    } else {
      console.log('❌ Conditions not met for AI prediction', {
        hasAiService: !!aiService,
        hasTransactions: transactions.length > 0,
        autoRefresh
      });
    }
  }, [transactions.length, currentBalance, apiKey, autoRefresh]);

  return {
    prediction,
    loading,
    error,
    lastUpdated,
    refreshPrediction,
    isConfigured: !!aiService
  };
}
