import React, { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, AlertCircle, Brain, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';
import { useAICashFlowContext } from '../../context/AICashFlowContext.tsx';

interface CashRunwayWidgetProps {
  transactions: Transaction[];
}

const CashRunwayWidget: React.FC<CashRunwayWidgetProps> = ({ transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('all');

  // Filter transactions based on selected period
  const filteredTransactions = transactions.filter(t => {
    if (selectedPeriod === 'all') return true;
    
    const transactionDate = new Date(t.date);
    const now = new Date();
    
    // Reset time to start of day for accurate comparison
    transactionDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    
    switch (selectedPeriod) {
      case 'month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
        const endOfQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
        return transactionDate >= startOfQuarter && transactionDate <= endOfQuarter;
      case 'year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31);
        return transactionDate >= startOfYear && transactionDate <= endOfYear;
      default:
        return true;
    }
  });

  // Calculate current balance manually by sorting transactions chronologically and summing amounts
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentBalance = sortedTransactions.reduce((balance, transaction) => balance + transaction.amount, 0);
  
  // Use shared AI context
  const { 
    prediction, 
    loading: aiLoading, 
    error: aiError, 
    refreshPrediction, 
    isConfigured,
    useAI,
    setUseAI
  } = useAICashFlowContext();
  
  // Calculate cash flow summary using filtered transactions
  const totalInflows = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalOutflows = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netCashFlow = totalInflows - totalOutflows;
  
  // Calculate burn rate using filtered transactions
  const burnRate = selectedPeriod === 'all' ? 
    (() => {
      // For 'all' period, use 6-month lookback as before
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const recentOutflows = transactions.filter(t => {
        const tDate = new Date(t.date);
        return t.amount < 0 && tDate >= sixMonthsAgo;
      });
      
      const recentOutflowsTotal = recentOutflows.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return recentOutflowsTotal > 0 ? recentOutflowsTotal / 6 : totalOutflows / Math.max(1, 12);
    })() :
    (() => {
      // For specific periods, calculate burn rate based on period length
      const periodMonths = selectedPeriod === 'month' ? 1 : selectedPeriod === 'quarter' ? 3 : 12;
      return totalOutflows / periodMonths;
    })();
  // Use AI runway analysis if available, otherwise use calculated runway
  console.log('🛣️ Runway calculation:', {
    useAI,
    hasRunwayAnalysis: !!prediction?.runwayAnalysis,
    aiCurrentRunway: prediction?.runwayAnalysis?.currentRunway,
    calculatedRunway: burnRate > 0 && currentBalance > 0 ? currentBalance / burnRate : 0
  });
  
  const runway = useAI && prediction?.runwayAnalysis?.currentRunway 
    ? prediction.runwayAnalysis.currentRunway 
    : (burnRate > 0 && currentBalance > 0 ? currentBalance / burnRate : 0);
  
  const projectedRunway = useAI && prediction?.runwayAnalysis?.projectedRunway 
    ? prediction.runwayAnalysis.projectedRunway 
    : runway;

  // Generate monthly trends for the last 12 months
  const monthlyTrends: Array<{
    month: string;
    inflows: number;
    outflows: number;
    netFlow: number;
  }> = [];
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === date.getMonth() && 
             tDate.getFullYear() === date.getFullYear();
    });
    
    const inflows = monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const outflows = monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    monthlyTrends.push({
      month: date.toLocaleDateString('en-US', { month: 'short' } as Intl.DateTimeFormatOptions),
      inflows,
      outflows,
      netFlow: inflows - outflows
    });
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRunwayColor = (months: number) => {
    if (months >= 12) return 'success';
    if (months >= 6) return 'warning';
    return 'danger';
  };

  const getRunwayIcon = (months: number) => {
    if (months >= 12) return CheckCircle;
    if (months >= 6) return AlertTriangle;
    return AlertCircle;
  };

  const runwayColor = getRunwayColor(runway);
  const RunwayIcon = getRunwayIcon(runway);

  // Calculate runway trend over time using manual balance calculations
  const runwayTrend = monthlyTrends.map((month, index) => {
    // Calculate historical balance at this point in time
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - (5 - index));
    targetDate.setDate(1); // First day of the month
    
    // Get all transactions up to this historical point
    const historicalTransactions = sortedTransactions.filter(t => 
      new Date(t.date) <= targetDate
    );
    
    // Calculate balance at this historical point
    const historicalBalance = Math.max(0, historicalTransactions.reduce((balance, t) => balance + t.amount, 0));

    // Calculate average burn rate for the 6 months leading up to this point
    const burnRateMonths = monthlyTrends.slice(Math.max(0, index - 5), index + 1);
    const avgBurnRate = burnRateMonths.length > 0 
      ? burnRateMonths.reduce((sum, m) => sum + m.outflows, 0) / burnRateMonths.length
      : 0;

    // Calculate runway: if no burn rate or negative balance, runway is 0
    const runway = avgBurnRate > 0 && historicalBalance > 0 
      ? historicalBalance / avgBurnRate 
      : historicalBalance > 0 ? 24 : 0; // If no outflows but positive balance, cap at 24

    return {
      month: month.month,
      runway: Math.min(runway, 24) // Cap at 24 months for chart readability
    };
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className={`p-2 bg-${runwayColor}-50 rounded-lg`}>
            {useAI && isConfigured ? (
              <Brain className={`h-6 w-6 text-${runwayColor}-600`} />
            ) : (
              <Clock className={`h-6 w-6 text-${runwayColor}-600`} />
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Cash Runway
              {useAI && isConfigured && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  AI-Enhanced
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              {useAI && isConfigured ? 'AI-enhanced runway analysis' : 'Months of cash remaining'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'month' | 'quarter' | 'year' | 'all')}
            className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          
          <div className="flex items-center">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useAI && isConfigured}
              onChange={(e) => {
                if (isConfigured) {
                  console.log('🎯 AI checkbox toggled:', e.target.checked);
                  setUseAI(e.target.checked);
                }
              }}
              disabled={!isConfigured}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className={`ml-2 text-sm ${isConfigured ? 'text-gray-700' : 'text-gray-400'}`}>
              AI Analysis
              {!isConfigured && (
                <span className="ml-1 text-xs text-gray-400">(API key required)</span>
              )}
            </span>
          </label>
          <button
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              refreshPrediction();
            }}
            disabled={aiLoading || !isConfigured}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isConfigured ? "Refresh AI analysis" : "API key required for AI analysis"}
          >
            <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
          </button>
          </div>
        </div>
      </div>

      {/* AI Runway Insights */}
      {useAI && prediction?.runwayAnalysis?.recommendations && prediction.runwayAnalysis.recommendations.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3">AI Runway Recommendations</h4>
          <div className="space-y-2">
            {prediction.runwayAnalysis.recommendations.map((recommendation, index) => (
              <p key={index} className="text-sm text-blue-800">• {recommendation}</p>
            ))}
          </div>
          {projectedRunway !== runway && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-medium">Projected Runway:</span> {projectedRunway.toFixed(1)} months
                <span className={`ml-2 ${projectedRunway > runway ? 'text-green-700' : 'text-red-700'}`}>
                  ({projectedRunway > runway ? '+' : ''}{(projectedRunway - runway).toFixed(1)} months)
                </span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {aiError && useAI && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">AI Analysis Error: {aiError}</p>
          <p className="text-xs text-red-600 mt-1">Showing calculated runway only</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runway Metrics */}
        <div className="space-y-4">
          {/* Main Runway Display */}
          <div className={`bg-${runwayColor}-50 border border-${runwayColor}-200 rounded-lg p-4`}>
            <div className="flex items-center">
              <RunwayIcon className={`h-8 w-8 text-${runwayColor}-600`} />
              <div className="ml-3">
                <p className={`text-sm font-medium text-${runwayColor}-600`}>
                  Cash Runway
                </p>
                <p className={`text-3xl font-bold text-${runwayColor}-900`}>
                  {runway.toFixed(1)}
                  <span className="text-lg font-medium ml-1">months</span>
                </p>
              </div>
            </div>
          </div>

          {/* Burn Rate */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Burn Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(burnRate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Based on last 6 months</p>
              </div>
            </div>
          </div>

          {/* Current Balance */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Latest Transaction Balance</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(currentBalance)}
                </p>
              </div>
            </div>
          </div>

          {/* Runway Status */}
          <div className={`border-l-4 border-${runwayColor}-400 bg-${runwayColor}-50 p-4`}>
            <div className="flex">
              <div className="ml-3">
                <p className={`text-sm font-medium text-${runwayColor}-800`}>
                  {runway >= 12 && 'Healthy Cash Position'}
                  {runway >= 6 && runway < 12 && 'Monitor Cash Flow'}
                  {runway < 6 && 'Critical Cash Position'}
                </p>
                <p className={`text-sm text-${runwayColor}-700 mt-1`}>
                  {runway >= 12 && 'Your business has a strong cash position with over a year of runway.'}
                  {runway >= 6 && runway < 12 && 'Consider optimizing expenses or increasing revenue to extend runway.'}
                  {runway < 6 && 'Immediate action needed to improve cash flow and extend runway.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Runway Trend Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">12-Month Runway Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={runwayTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis
                domain={[0, 24]}
                tickFormatter={(value) => `${value}mo`}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} months`, 'Runway']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="runway"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
              {/* Reference lines */}
              <Line
                type="monotone"
                dataKey={() => 12}
                stroke="#10b981"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={() => 6}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-2 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-success-500 mr-1"></div>
              <span>Healthy (12+ months)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-warning-500 mr-1"></div>
              <span>Caution (6+ months)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashRunwayWidget;
