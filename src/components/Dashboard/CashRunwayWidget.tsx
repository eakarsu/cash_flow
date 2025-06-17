import React from 'react';
import { Clock, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction } from '../../types';

interface CashRunwayWidgetProps {
  transactions: Transaction[];
}

const CashRunwayWidget: React.FC<CashRunwayWidgetProps> = ({ transactions }) => {
  // Calculate cash flow summary
  const totalInflows = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalOutflows = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netCashFlow = totalInflows - totalOutflows;
  
  // Calculate burn rate (average monthly outflows over last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentOutflows = transactions.filter(t => {
    const tDate = new Date(t.date);
    return t.amount < 0 && tDate >= sixMonthsAgo;
  });
  
  const recentOutflowsTotal = recentOutflows.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  // If no recent outflows, use all-time average
  const burnRate = recentOutflowsTotal > 0 ? recentOutflowsTotal / 6 : totalOutflows / Math.max(1, transactions.length > 0 ? 12 : 1);
  // Calculate current balance as cumulative sum of all transactions
  const currentBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const runway = burnRate > 0 && currentBalance > 0 ? currentBalance / burnRate : 0;

  // Generate monthly trends for the last 12 months
  const monthlyTrends = [];
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
      month: date.toLocaleDateString('en-US', { month: 'short' }),
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

  // Calculate runway trend over time
  const runwayTrend = monthlyTrends.map((month, index) => {
    // Calculate cumulative balance up to this month
    const cumulativeNetFlow = monthlyTrends
      .slice(0, index + 1)
      .reduce((sum, m) => sum + m.netFlow, 0);
    
    // Estimate balance at this point (this is a simplified approach)
    // In reality, you'd want to track actual balances over time
    const estimatedBalance = Math.max(0, currentBalance - cumulativeNetFlow);

    const avgBurnRate = monthlyTrends
      .slice(Math.max(0, index - 5), index + 1)
      .reduce((sum, m) => sum + Math.abs(m.outflows), 0) / Math.min(6, index + 1);

    const runway = avgBurnRate > 0 && estimatedBalance > 0 ? estimatedBalance / avgBurnRate : 0;

    return {
      month: month.month,
      runway: Math.min(runway, 24) // Cap at 24 months for chart readability
    };
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-6">
        <div className={`p-2 bg-${runwayColor}-50 rounded-lg`}>
          <Clock className={`h-6 w-6 text-${runwayColor}-600`} />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900">Cash Runway</h3>
          <p className="text-sm text-gray-500">Months of cash remaining</p>
        </div>
      </div>

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
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
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
