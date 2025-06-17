import React, { useState } from 'react';
import { TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../../types';

interface CashInflowsWidgetProps {
  transactions: Transaction[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const CashInflowsWidget: React.FC<CashInflowsWidgetProps> = ({ transactions }) => {
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

  const inflowTransactions = filteredTransactions.filter(t => t.amount > 0);
  const totalInflows = inflowTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const categoryBreakdown = inflowTransactions.reduce((acc, transaction) => {
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
    percentage: totalInflows > 0 ? (cat.amount / totalInflows) * 100 : 0
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
      inflows: monthTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      outflows: monthTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
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
            <h4 className="text-sm font-medium text-gray-900 mb-3">6-Month Trend</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Inflows']} />
                <Bar dataKey="inflows" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Pie Chart */}
          {categoryArray.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Income Distribution</h4>
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

export default CashInflowsWidget;
