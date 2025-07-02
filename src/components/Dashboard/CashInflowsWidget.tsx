import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign,Brain } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Transaction } from '../../types';
import { useAICashFlowContext } from '../../context/AICashFlowContext';



ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface CashInflowsWidgetProps {
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CashInflowsWidget: React.FC<CashInflowsWidgetProps> = ({ transactions }) => {
  const {
  prediction,
  loading: aiLoading,
  error: aiError,
  refreshPrediction,
  isConfigured,
  useAI,
  setUseAI
} = useAICashFlowContext();

  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('all');

  const { filteredTransactions, inflowTransactions, totalInflows, categoryArray, monthlyTrends } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (selectedPeriod !== 'all') {
      switch (selectedPeriod) {
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31);
          break;
      }
    }

    const filtered = selectedPeriod === 'all' ? transactions : transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate >= startDate! && transactionDate <= endDate!;
    });

    const inflows = filtered.filter(t => t.amount > 0);
    const totalInflow = inflows.reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = inflows.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = { category, amount: 0, count: 0 };
      }
      acc[category].amount += transaction.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, any>);

    const categories = Object.values(categoryBreakdown).map(cat => ({
      ...cat,
      percentage: totalInflow > 0 ? (cat.amount / totalInflow) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    const trends: Array<{ month: string; inflows: number; outflows: number; }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        inflows: monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
        outflows: monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
      });
    }

    return {
      filteredTransactions: filtered,
      inflowTransactions: inflows,
      totalInflows: totalInflow,
      categoryArray: categories,
      monthlyTrends: trends
    };
  }, [transactions, selectedPeriod]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Bar chart data for monthly trends
  const barChartData = {
    labels: monthlyTrends.map(trend => trend.month),
    datasets: [
      {
        label: 'Inflows',
        data: monthlyTrends.map(trend => trend.inflows),
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Inflows: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => value === 0 ? '0' : `$${(value / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  // Doughnut chart data for category breakdown
  const doughnutChartData = {
    labels: categoryArray.slice(0, 6).map(cat => cat.category),
    datasets: [
      {
        data: categoryArray.slice(0, 6).map(cat => cat.amount),
        backgroundColor: COLORS,
        borderColor: COLORS.map(color => color),
        borderWidth: 2,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const category = categoryArray[context.dataIndex];
            return `${category.category}: ${formatCurrency(category.amount)} (${category.percentage.toFixed(1)}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-success-600" />
          <h3 className="text-lg font-medium text-gray-900">Cash Inflows</h3>
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
      
        <div className="text-sm text-gray-500">Revenue and income tracking</div>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-success-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-success-600" />
            <span className="text-sm font-medium text-success-600">Total Inflows</span>
          </div>
          <p className="text-2xl font-bold text-success-900 mt-1">
            {formatCurrency(totalInflows)}
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <span className="text-sm font-medium text-gray-600">Income Sources</span>
          <div className="mt-2 space-y-2">
            {categoryArray.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700">{category.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(category.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {totalInflows > 0 ? `${category.percentage.toFixed(1)}%` : '0%'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* AI Category Insights */}
      {useAI && prediction?.categoryInsights && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">AI Category Analysis</span>
          </div>
          
          <div className="space-y-3">
            {prediction.categoryInsights
              .filter(insight => 
                // For inflows: show revenue categories, for outflows: show expense categories
                insight.category === 'Sales' ? true : insight.category !== 'Sales'
              )
              .map((insight, index) => (
                <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-400">
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="font-medium text-gray-900">{insight.category}</h6>
                      <p className="text-sm text-gray-600">
                        Trend: <span className={`font-medium ${
                          insight.trend === 'increasing' ? 'text-green-600' : 
                          insight.trend === 'decreasing' ? 'text-red-600' : 'text-yellow-600'
                        }`}>{insight.trend}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Projected: ${insight.projectedAmount?.toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      insight.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      insight.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {insight.riskLevel} risk
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}


      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">6-Month Trend</h4>
          {monthlyTrends.length > 0 && monthlyTrends.some(trend => trend.inflows > 0) ? (
            <div style={{ height: '200px' }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
              <p className="text-gray-500">No trend data for this period.</p>
            </div>
          )}
        </div>

        {/* Category Distribution Doughnut Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Income Distribution</h4>
          {categoryArray.length > 0 && categoryArray.some(cat => cat.amount > 0) ? (
            <div style={{ height: '200px' }}>
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
              <p className="text-gray-500">No income data for this period.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashInflowsWidget;

