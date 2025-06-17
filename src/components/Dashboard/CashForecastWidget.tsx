import React, { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Brain, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Transaction } from '../../types';
import { useAICashFlow } from '../../hooks/useAICashFlow.ts';

interface CashForecastWidgetProps {
  transactions: Transaction[];
}

const CashForecastWidget: React.FC<CashForecastWidgetProps> = ({ transactions }) => {
  const [scenario, setScenario] = useState<'realistic' | 'optimistic' | 'pessimistic'>('realistic');
  const [useAI, setUseAI] = useState(false);
  
  // Get current balance
  const currentBalance = transactions.length > 0 ? 
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].balance || 0 : 0;
  
  // AI predictions hook
  const { 
    prediction, 
    loading: aiLoading, 
    error: aiError, 
    refreshPrediction, 
    isConfigured 
  } = useAICashFlow(transactions, currentBalance, {
    apiKey: process.env.REACT_APP_OPENROUTER_API_KEY,
    autoRefresh: useAI
  });

  // Calculate average weekly cash flows
  const weeklyData = transactions.reduce((acc, transaction) => {
    const date = new Date(transaction.date);
    const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
    
    if (!acc[weekKey]) {
      acc[weekKey] = { inflows: 0, outflows: 0 };
    }
    
    if (transaction.amount > 0) {
      acc[weekKey].inflows += transaction.amount;
    } else {
      acc[weekKey].outflows += Math.abs(transaction.amount);
    }
    
    return acc;
  }, {} as Record<string, { inflows: number; outflows: number }>);

  const weeklyEntries = Object.values(weeklyData);
  const avgWeeklyInflows = weeklyEntries.length > 0 
    ? weeklyEntries.reduce((sum, week) => sum + week.inflows, 0) / weeklyEntries.length 
    : 0;
  const avgWeeklyOutflows = weeklyEntries.length > 0 
    ? weeklyEntries.reduce((sum, week) => sum + week.outflows, 0) / weeklyEntries.length 
    : 0;

  // Use AI predictions if available and enabled, otherwise fall back to historical calculation
  const forecastWithScenarios = useAI && prediction?.weeklyForecasts ? 
    prediction.weeklyForecasts : 
    (() => {
      // Generate 13-week forecast using historical data
      const forecast: Array<{
        week: string;
        projectedBalance: number;
        inflows: number;
        outflows: number;
        optimistic: number;
        realistic: number;
        pessimistic: number;
      }> = [];
      let balance = currentBalance;
      
      for (let week = 0; week < 13; week++) {
        const date = new Date();
        date.setDate(date.getDate() + (week * 7));
        
        const variationFactor = 1 + (week * 0.02); // Increasing uncertainty over time
        const weeklyNetFlow = avgWeeklyInflows - avgWeeklyOutflows;
        
        balance += weeklyNetFlow;
        
        forecast.push({
          week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          projectedBalance: balance,
          inflows: avgWeeklyInflows,
          outflows: avgWeeklyOutflows,
          optimistic: balance * (1 + 0.15 * variationFactor),
          realistic: balance,
          pessimistic: balance * (1 - 0.15 * variationFactor),
        });
      }
      return forecast;
    })();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'optimistic': return '#10b981';
      case 'pessimistic': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const finalBalance = forecastWithScenarios[forecastWithScenarios.length - 1];
  const projectedChange = finalBalance[scenario] - currentBalance;
  const projectedChangePercent = currentBalance > 0 ? (projectedChange / currentBalance) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-primary-50 rounded-lg">
            {useAI && isConfigured ? (
              <Brain className="h-6 w-6 text-primary-600" />
            ) : (
              <Calendar className="h-6 w-6 text-primary-600" />
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              13-Week Cash Forecast
              {useAI && isConfigured && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  AI-Powered
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-500">
              {useAI && isConfigured ? 'AI-generated predictions' : 'Historical trend-based projections'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isConfigured && (
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">AI Predictions</span>
              </label>
              {useAI && (
                <button
                  onClick={refreshPrediction}
                  disabled={aiLoading}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Refresh AI predictions"
                >
                  <RefreshCw className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          )}
          
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as 'realistic' | 'optimistic' | 'pessimistic')}
            className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="realistic">Realistic</option>
            <option value="optimistic">Optimistic</option>
            <option value="pessimistic">Pessimistic</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Current Balance */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Current Balance</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(currentBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* Projected Balance */}
        <div className="bg-primary-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-primary-600">13-Week Projection</p>
              <p className="text-xl font-bold text-primary-900">
                {formatCurrency(finalBalance[scenario])}
              </p>
            </div>
          </div>
        </div>

        {/* Projected Change */}
        <div className={`${projectedChange >= 0 ? 'bg-success-50' : 'bg-danger-50'} rounded-lg p-4`}>
          <div className="flex items-center">
            <div className={`p-2 ${projectedChange >= 0 ? 'bg-success-100' : 'bg-danger-100'} rounded-lg`}>
              {projectedChange >= 0 ? (
                <TrendingUp className={`h-5 w-5 ${projectedChange >= 0 ? 'text-success-600' : 'text-danger-600'}`} />
              ) : (
                <TrendingDown className={`h-5 w-5 ${projectedChange >= 0 ? 'text-success-600' : 'text-danger-600'}`} />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${projectedChange >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                Projected Change
              </p>
              <p className={`text-xl font-bold ${projectedChange >= 0 ? 'text-success-900' : 'text-danger-900'}`}>
                {projectedChange >= 0 ? '+' : ''}{formatCurrency(projectedChange)}
              </p>
              <p className={`text-xs ${projectedChange >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                {projectedChangePercent >= 0 ? '+' : ''}{projectedChangePercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {useAI && prediction?.summary && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">AI Insights</h4>
          <div className="space-y-2">
            {prediction.summary.keyInsights.map((insight, index) => (
              <p key={index} className="text-sm text-blue-800">• {insight}</p>
            ))}
          </div>
          {prediction.summary.actionItems.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-blue-900">Recommended Actions:</p>
              {prediction.summary.actionItems.map((action, index) => (
                <p key={index} className="text-sm text-blue-800">• {action}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {aiError && useAI && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">AI Prediction Error: {aiError}</p>
          <p className="text-xs text-red-600 mt-1">Falling back to historical data analysis</p>
        </div>
      )}

      {/* Forecast Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Cash Balance Projection
          {aiLoading && (
            <span className="ml-2 text-xs text-gray-500">Updating AI predictions...</span>
          )}
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={forecastWithScenarios}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value, name) => [formatCurrency(Number(value)), name]}
              labelFormatter={(label) => `Week of ${label}`}
            />

            {/* Show all scenarios as light areas */}
            <Area
              type="monotone"
              dataKey="optimistic"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.1}
            />
            <Area
              type="monotone"
              dataKey="pessimistic"
              stackId="2"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.1}
            />

            {/* Highlight selected scenario */}
            <Line
              type="monotone"
              dataKey={scenario}
              stroke={getScenarioColor(scenario)}
              strokeWidth={3}
              dot={{ fill: getScenarioColor(scenario), strokeWidth: 2, r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Cash Flow Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inflows
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outflows
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Flow
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ending Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecastWithScenarios.slice(0, 6).map((week, index) => {
                const netFlow = week.inflows - week.outflows;
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                      {week.week}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-success-600">
                      {formatCurrency(week.inflows)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-danger-600">
                      {formatCurrency(week.outflows)}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-sm ${netFlow >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {netFlow >= 0 ? '+' : ''}{formatCurrency(netFlow)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(week[scenario])}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashForecastWidget;
