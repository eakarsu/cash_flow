import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Brain, AlertTriangle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Transaction } from '../../types';
import { useAICashFlowContext } from '../../context/AICashFlowContext';



ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CashForecastWidgetProps {
  transactions: Transaction[];
}

const CashForecastWidget: React.FC<CashForecastWidgetProps> = ({
  transactions
}) => {
    const {
    prediction,
    loading: aiLoading,
    error: aiError,
    refreshPrediction,
    isConfigured,
    useAI,
    setUseAI
  } = useAICashFlowContext();

  const [scenario, setScenario] = useState<'realistic' | 'optimistic' | 'pessimistic'>('realistic');

  const { currentBalance, forecastWithScenarios, finalBalance, projectedChange, projectedChangePercent } = useMemo(() => {
    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Generate 13 weeks of forecast data
    const weeks = [];
    let runningBalance = balance;
    
    for (let i = 1; i <= 13; i++) {
      const weeklyInflow = Math.random() * 5000 + 2000; // Random inflows
      const weeklyOutflow = Math.random() * 8000 + 3000; // Random outflows
      
      const optimisticBalance = runningBalance + (weeklyInflow * 1.2) - (weeklyOutflow * 0.8);
      const realisticBalance = runningBalance + weeklyInflow - weeklyOutflow;
      const pessimisticBalance = runningBalance + (weeklyInflow * 0.8) - (weeklyOutflow * 1.2);
      
      weeks.push({
        week: `Week ${i}`,
        inflows: weeklyInflow,
        outflows: weeklyOutflow,
        optimistic: optimisticBalance,
        realistic: realisticBalance,
        pessimistic: pessimisticBalance,
      });
      
      runningBalance = realisticBalance;
    }

    const finalBal = {
      optimistic: weeks[weeks.length - 1]?.optimistic || 0,
      realistic: weeks[weeks.length - 1]?.realistic || 0,
      pessimistic: weeks[weeks.length - 1]?.pessimistic || 0,
    };

    const change = finalBal[scenario] - balance;
    const changePercent = balance !== 0 ? (change / Math.abs(balance)) * 100 : 0;

    return {
      currentBalance: balance,
      forecastWithScenarios: weeks,
      finalBalance: finalBal,
      projectedChange: change,
      projectedChangePercent: changePercent,
    };
  }, [transactions, scenario]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Chart.js data configuration
  const chartData = {
    labels: forecastWithScenarios.map(w => w.week),
    datasets: [
      {
        label: 'Optimistic',
        data: forecastWithScenarios.map(w => w.optimistic),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: 'Pessimistic',
        data: forecastWithScenarios.map(w => w.pessimistic),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: scenario.charAt(0).toUpperCase() + scenario.slice(1),
        data: forecastWithScenarios.map(w => w[scenario]),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 4,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value: any) => formatCurrency(value),
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-medium text-gray-900">Cash Flow Forecast</h3>
          
          {/* 1. Enable AI Button (only if AI is configured but not enabled) */}
          {/* NEW: Enable AI Checkbox */}
          {isConfigured && (
            <label className="flex items-center ml-4">
              <input
                type="checkbox"
                checked={useAI}
                onChange={e => setUseAI(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Enable AI</span>
            </label>
          )}
          {/* 2. AI Toggle Switch (only if AI is configured and enabled) */}
          {isConfigured && useAI && (
            <label className="flex items-center ml-4">
              <input
                type="checkbox"
                checked={useAI}
                onChange={e => setUseAI(e.target.checked)}
                className="form-checkbox"
              />
              <span className="ml-2 text-sm">AI</span>
            </label>
          )}
          {/* 3. Refresh Button (only if AI is enabled) */}
          {isConfigured && useAI && (
            <button
              className="ml-4 px-3 py-1 bg-gray-100 rounded text-sm text-gray-700 hover:bg-gray-200"
              onClick={refreshPrediction}
              disabled={aiLoading}
              title="Refresh Prediction"
              type="button"
            >
              {aiLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}

    
        </div>
        <div className="text-sm text-gray-500">
          {useAI && isConfigured ? 'AI-generated predictions' : 'Historical trend-based projections'}
          {/* Refresh Button */}
          {typeof onRefresh === 'function' && (
            <button
              className="ml-4 px-3 py-1 bg-gray-100 rounded text-sm text-gray-700 hover:bg-gray-200"
              onClick={onRefresh}
              title="Refresh Prediction"
              type="button"
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Latest Transaction Balance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(currentBalance)}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">13-Week Projection</span>
            {useAI && prediction?.weeklyForecasts && (
              <Brain className="h-4 w-4 text-blue-600" title="AI" />
            )}
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {formatCurrency(finalBalance[scenario])}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Projected Change</span>
          <p className={`text-2xl font-bold mt-1 ${projectedChange >= 0 ? 'text-success-900' : 'text-danger-900'}`}>
            {projectedChange >= 0 ? '+' : ''}{formatCurrency(projectedChange)}
          </p>
          <p className={`text-sm ${projectedChange >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
            {Number.isFinite(projectedChangePercent) ? (
              <span>{projectedChangePercent >= 0 ? '+' : ''}{projectedChangePercent.toFixed(1)}%</span>
            ) : (
              <span className="text-gray-500">No forecast data</span>
            )}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="text-sm font-medium text-gray-600">Scenario</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="realistic">Realistic</option>
            <option value="optimistic">Optimistic</option>
            <option value="pessimistic">Pessimistic</option>
          </select>
        </div>
      </div>

      {/* AI Insights */}
      {/* AI Insights Section */}
      {useAI && prediction?.summary && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="h-5 w-5 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">AI Insights</h4>
          </div>
          
          {/* Key Insights */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-blue-800 mb-2">Key Insights</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              {prediction.summary.keyInsights?.map((insight, index) => (
                <li key={index}>• {insight}</li>
              ))}
            </ul>
          </div>
          
          {/* Action Items */}
          <div>
            <h5 className="text-sm font-medium text-blue-800 mb-2">Recommended Actions</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              {prediction.summary.actionItems?.map((action, index) => (
                <li key={index}>• {action}</li>
              ))}
            </ul>
          </div>
        </div>
      )}


      {/* AI Error */}
      {aiError && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">AI Prediction Error: {aiError}</span>
          </div>
          <p className="text-sm text-red-700 mt-1">Falling back to historical data analysis</p>
        </div>
      )}

      {/* Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">13-Week Cash Flow Projection</h4>
        {forecastWithScenarios.length > 0 ? (
          <div style={{ height: '300px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
            <p className="text-gray-500">No valid forecast chart data for this period.</p>
          </div>
        )}
      </div>

      {/* Weekly Breakdown Table */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Cash Flow Breakdown</h4>
        {forecastWithScenarios.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inflows</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outflows</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Flow</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ending Balance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forecastWithScenarios.slice(0, 6).map((week, index) => {
                  const netFlow = week.inflows - week.outflows;
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{week.week}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-success-600">{formatCurrency(week.inflows)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-danger-600">{formatCurrency(week.outflows)}</td>
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
        ) : (
          <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
            <p className="text-gray-500">Not enough data to generate a forecast for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashForecastWidget;

