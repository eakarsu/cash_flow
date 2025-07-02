import React, { useMemo } from 'react';
import { TrendingUp, DollarSign, AlertTriangle, Brain } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Transaction } from '../../types';
import { useAICashFlowContext } from '../../context/AICashFlowContext';



ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CashRunwayWidgetProps {
  transactions: Transaction[];
}

const CashRunwayWidget: React.FC<CashRunwayWidgetProps> = ({
  transactions,
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

  const { currentBalance, runway, projectedRunway, burnRate, runwayColor, recommendations } = useMemo(() => {
    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate monthly burn rate (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentTransactions = transactions.filter(t => new Date(t.date) >= sixMonthsAgo);
    const monthlyOutflows = recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 6;
    
    const calculatedRunway = monthlyOutflows > 0 ? balance / monthlyOutflows : Infinity;
    const projectedRunwayValue = calculatedRunway * 1.1; // Simple projection
    
    const color = calculatedRunway >= 12 ? 'green' : calculatedRunway >= 6 ? 'yellow' : 'red';
    
    const recs = [
      calculatedRunway < 6 ? 'Immediate action needed to improve cash flow' : null,
      calculatedRunway < 12 ? 'Consider reducing expenses or increasing revenue' : null,
      'Monitor cash flow trends regularly',
    ].filter(Boolean);

    return {
      currentBalance: balance,
      runway: calculatedRunway,
      projectedRunway: projectedRunwayValue,
      burnRate: monthlyOutflows,
      runwayColor: color,
      recommendations: recs,
    };
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Runway visualization chart
  const chartData = {
    labels: ['Current Runway', 'Projected Runway'],
    datasets: [
      {
        label: 'Months',
        data: [
          Number.isFinite(runway) && runway > 0 ? runway : 0,
          Number.isFinite(projectedRunway) && projectedRunway > 0 ? projectedRunway : 0
        ],
        backgroundColor: [
          runway >= 12 ? '#10b981' : runway >= 6 ? '#f59e0b' : '#ef4444',
          projectedRunway >= 12 ? '#10b981' : projectedRunway >= 6 ? '#f59e0b' : '#ef4444',
        ],
        borderColor: [
          runway >= 12 ? '#059669' : runway >= 6 ? '#d97706' : '#dc2626',
          projectedRunway >= 12 ? '#059669' : projectedRunway >= 6 ? '#d97706' : '#dc2626',
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y.toFixed(1)} months`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(24, Math.max(runway, projectedRunway) * 1.2),
        ticks: {
          callback: (value: any) => `${value} mo`,
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h3 className="text-lg font-medium text-gray-900">Cash Runway</h3>

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
          {useAI && isConfigured ? 'AI-enhanced runway analysis' : 'Months of cash remaining'}
        </div>
      </div>

      {/* AI Recommendations */}
      {/* AI Runway Recommendations */}
      {useAI && prediction?.runwayAnalysis?.recommendations && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">AI Runway Analysis</span>
          </div>
          <ul className="text-sm text-blue-800 space-y-1">
            {prediction.runwayAnalysis.recommendations.map((recommendation, index) => (
              <li key={index}>• {recommendation}</li>
            ))}
          </ul>
          
          {/* AI Runway Metrics */}
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <span className="text-xs text-blue-600">AI Burn Rate</span>
              <p className="text-sm font-medium">${prediction.runwayAnalysis.burnRate?.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-xs text-blue-600">Current Runway</span>
              <p className="text-sm font-medium">{prediction.runwayAnalysis.currentRunway} months</p>
            </div>
            <div>
              <span className="text-xs text-blue-600">Projected Runway</span>
              <p className="text-sm font-medium">{prediction.runwayAnalysis.projectedRunway} months</p>
            </div>
          </div>
        </div>
      )}


      {/* AI Error */}
      {aiError && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">AI Analysis Error: {aiError}</span>
          </div>
          <p className="text-sm text-red-700 mt-1">Showing calculated runway only</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <span className="text-sm font-medium text-blue-600">Cash Runway</span>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            {Number.isFinite(runway) && runway > 0 ? `${runway.toFixed(1)} months` : 'No runway data for this period.'}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Monthly Burn Rate</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Number.isFinite(burnRate) && burnRate > 0 ? formatCurrency(burnRate) : 'No burn rate data for this period.'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Based on last 6 months</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Latest Transaction Balance</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(currentBalance)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Projected Runway</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Number.isFinite(projectedRunway) && projectedRunway > 0 
              ? `${projectedRunway.toFixed(1)} months` 
              : 'No projected runway data'}
          </p>
          <p className={`text-xs mt-1 ${projectedRunway > runway ? 'text-green-700' : 'text-red-700'}`}>
            {Number.isFinite(projectedRunway) && Number.isFinite(runway) && projectedRunway > runway
              ? `(+${(projectedRunway - runway).toFixed(1)} months)`
              : ''}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className={`text-sm font-medium text-${runwayColor === 'green' ? 'green' : runwayColor === 'yellow' ? 'yellow' : 'red'}-800`}>
          {!Number.isFinite(runway) || runway <= 0 
            ? 'No runway data for this period.' 
            : runway >= 12 
              ? 'Healthy Cash Position' 
              : runway >= 6 
                ? 'Monitor Cash Flow' 
                : 'Critical Cash Position'}
        </p>
        <p className={`text-sm text-${runwayColor === 'green' ? 'green' : runwayColor === 'yellow' ? 'yellow' : 'red'}-700 mt-1`}>
          {!Number.isFinite(runway) || runway <= 0 
            ? 'No runway data for this period.' 
            : runway >= 12 
              ? 'Your business has a strong cash position with over a year of runway.' 
              : runway >= 6 
                ? 'Consider optimizing expenses or increasing revenue to extend runway.' 
                : 'Immediate action needed to improve cash flow and extend runway.'}
        </p>
      </div>

      {/* Runway Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Runway Comparison</h4>
        {Number.isFinite(runway) && runway > 0 ? (
          <div style={{ height: '200px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
            <p className="text-gray-500">No runway data for this period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashRunwayWidget;

