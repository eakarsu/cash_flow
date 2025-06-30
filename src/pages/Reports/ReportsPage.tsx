import React, { useState } from 'react';
import { BarChart3, Download, Calendar, Filter, TrendingUp, DollarSign } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';

const ReportsPage: React.FC = () => {
  const { transactions } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [selectedReport, setSelectedReport] = useState<'summary' | 'detailed' | 'forecast'>('summary');

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

  const totalInflows = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalOutflows = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netCashFlow = totalInflows - totalOutflows;

  const categoryBreakdown = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { inflows: 0, outflows: 0, net: 0 };
    }
    if (t.amount > 0) {
      acc[t.category].inflows += t.amount;
    } else {
      acc[t.category].outflows += Math.abs(t.amount);
    }
    acc[t.category].net = acc[t.category].inflows - acc[t.category].outflows;
    return acc;
  }, {} as Record<string, { inflows: number; outflows: number; net: number }>);

  const handleExportReport = () => {
    const reportData = {
      period: selectedPeriod,
      reportType: selectedReport,
      summary: {
        totalInflows,
        totalOutflows,
        netCashFlow,
        transactionCount: filteredTransactions.length
      },
      categoryBreakdown,
      transactions: filteredTransactions
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cash-flow-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
              <p className="text-gray-600">Generate comprehensive financial reports and analytics</p>
            </div>
            <button
              onClick={handleExportReport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>

          {/* Filters */}
          <div className="flex space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
            <select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value as any)}
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="forecast">Forecast Report</option>
            </select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Inflows</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalInflows.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Outflows</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalOutflows.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`h-6 w-6 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                <p className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Category Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inflows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outflows
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(categoryBreakdown).map(([category, data]) => (
                  <tr key={category}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ${data.inflows.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      ${data.outflows.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      data.net >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.net >= 0 ? '+' : ''}${data.net.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Balance: ${transaction.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
