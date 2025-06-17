import React, { useState } from 'react';
import { TrendingDown, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../../types';

interface CashOutflowsWidgetProps {
  transactions: Transaction[];
}

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#3b82f6'];

const CashOutflowsWidget: React.FC<CashOutflowsWidgetProps> = ({ transactions }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('all');

  // Filter transactions based on selected period
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'month':
        return transactionDate.getMonth() === now.getMonth() && 
               transactionDate.getFullYear() === now.getFullYear();
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const transactionQuarter = Math.floor(transactionDate.getMonth() / 3);
        return transactionQuarter === currentQuarter && 
               transactionDate.getFullYear() === now.getFullYear();
      case 'year':
        return transactionDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });

  const outflowTransactions = filteredTransactions.filter(t => t.type === 'outflow');
  const totalOutflows = outflowTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const categoryBreakdown = outflowTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = { category, amount: 0, count: 0 };
    }
    acc[category].amount += transaction.amount;
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { category: string; amount: number; count: number }>);

  const categoryArray = Object.values(categoryBreakdown).map(cat => ({
    ...cat,
    percentage: totalOutflows > 0 ? (cat.amount / totalOutflows) * 100 : 0
  })).sort((a, b) => b.amount - a.amount);

  // Generate monthly trends for the last 6 months
  const monthlyTrends = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === date.getMonth() && 
             tDate.getFullYear() === date.getFullYear();
    });
    
    monthlyTrends.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      inflows: monthTransactions.filter(t => t.type === 'inflow').reduce((sum, t) => sum + t.amount, 0),
      outflows: monthTransactions.filter(t => t.type === 'outflow').reduce((sum, t) => sum + t.amount, 0)
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-danger-50 rounded-lg">
            <TrendingDown className="h-6 w-6 text-danger-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">Cash Outflows</h3>
            <p className="text-sm text-gray-500">Expenses and spending analysis</p>
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
          <div className="bg-danger-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-danger-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-danger-600">Total Outflows</p>
                <p className="text-2xl font-bold text-danger-900">
                  {formatCurrency(totalOutflows)}
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Expense Categories</h4>
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

          {/* Top Spending Alert */}
          {categoryArray.length > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-warning-600 mt-0.5" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-warning-800">
                    Largest Expense Category
                  </p>
                  <p className="text-sm text-warning-700">
                    {categoryArray[0].category} accounts for {categoryArray[0].percentage.toFixed(1)}%
                    of total spending ({formatCurrency(categoryArray[0].amount)})
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts */}
        <div className="space-y-6">
          {/* Monthly Trends */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">6-Month Spending Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Outflows']} />
                <Bar dataKey="outflows" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Pie Chart */}
          {categoryArray.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Expense Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryArray.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {categoryArray.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CashOutflowsWidget;
