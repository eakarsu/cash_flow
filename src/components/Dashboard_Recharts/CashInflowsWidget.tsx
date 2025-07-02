import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../../types';

interface CashInflowsWidgetProps {
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CashInflowsWidget: React.FC<CashInflowsWidgetProps> = ({ transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('all');

  // Memoize expensive calculations
  const { filteredTransactions, inflowTransactions, totalInflows, categoryArray, monthlyTrends } = useMemo(() => {
    // Pre-calculate date boundaries once
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

    // Filter transactions once
    const filtered = selectedPeriod === 'all' ? transactions : transactions.filter(t => {
      const transactionDate = new Date(t.date);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate >= startDate! && transactionDate <= endDate!;
    });

    const inflows = filtered.filter(t => t.amount > 0);
    const totalInflow = inflows.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate category breakdown
    const categoryBreakdown = inflows.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = { category, amount: 0, count: 0 };
      }
      acc[category].amount += transaction.amount;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { category: string; amount: number; count: number }>);

    const categories = Object.values(categoryBreakdown).map(cat => ({
      ...cat,
      percentage: totalInflow > 0 ? (cat.amount / totalInflow) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);

    // Generate monthly trends (use all transactions for historical context)
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
        month: date.toLocaleDateString('en-US', { month: 'short' } as Intl.DateTimeFormatOptions),
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

  console.log('[CashInflowsWidget] totalInflows:', totalInflows);
  console.log('[CashInflowsWidget] categoryArray:', categoryArray);
  console.log('[CashInflowsWidget] monthlyTrends:', monthlyTrends);
  console.log('[CashInflowsWidget] filteredTransactions:', filteredTransactions);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-success-50 rounded-lg">
            <TrendingUp className="h-6 w-6 text-success-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Cash Inflows</h3>
            <p className="text-sm text-gray-500">Revenue and income tracking</p>
          </div>
        </div>

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Summary Stats */}
        <div className="space-y-4">
          <div className="bg-success-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-success-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-success-600">Total Inflows</p>
                <p className="text-2xl font-bold text-success-900">
                  {formatCurrency(totalInflows)}
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Income Sources</h4>
            <div className="space-y-2">
              {categoryArray.slice(0, 5).map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(category.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Monthly Trends */}
          <div>
            {/* Monthly Trends */}
            <h4 className="text-sm font-medium text-gray-900 mb-3">6-Month Trend</h4>
            {monthlyTrends.length > 0 && monthlyTrends.some(trend => trend.inflows > 0) ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 'dataMax']} tickFormatter={value => value === 0 ? '0' : `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={value => [formatCurrency(Number(value)), 'Inflows']} />
                  <Bar dataKey="inflows" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
                <p className="text-gray-500">No trend data for this period.</p>
              </div>
            )}
          </div>

          {/* Category Pie Chart */}
          {categoryArray.length > 0 && (
            <div>
              {/* Category Pie Chart */}
              <h4 className="text-sm font-medium text-gray-900 mb-3">Income Distribution</h4>
              {categoryArray.length > 0 && categoryArray.some(cat => cat.amount > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={categoryArray.filter(cat => cat.amount > 0)}
                      dataKey="amount"
                      cx="50%" cy="50%" outerRadius={60} fill="#8884d8"
                    >
                      {categoryArray.filter(cat => cat.amount > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={value => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No income data for this period.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashInflowsWidget;
