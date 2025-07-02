import React from 'react';
import { TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import CashOutflowsWidget from '../../components/Dashboard/CashOutflowsWidget';

const CashOutflowsPage: React.FC = () => {
  const { transactions } = useTransactions();
  
  const outflowTransactions = transactions.filter(t => t.amount < 0);
  const totalOutflows = outflowTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const avgMonthlyOutflow = totalOutflows / Math.max(1, new Set(outflowTransactions.map(t => t.date.substring(0, 7))).size);
  
  const categoryBreakdown = outflowTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <TrendingDown className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Cash Outflows Analysis</h1>
          </div>
          <p className="text-gray-600">
            Detailed analysis of your expenses and cash outflows
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
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
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Monthly Outflow</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${avgMonthlyOutflow.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Expense Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(categoryBreakdown).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <CashOutflowsWidget transactions={transactions} />
          
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Outflow by Category</h3>
            <div className="space-y-4">
              {Object.entries(categoryBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm font-bold text-red-600">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Outflow Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Outflow Transactions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {outflowTransactions.slice(0, 10).map((transaction) => (
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
                    <p className="text-sm font-medium text-red-600">
                      ${Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Balance: ${typeof transaction.balance === 'string' && transaction.balance === '' ? 
                        'N/A' : 
                        Number(transaction.balance || 0).toLocaleString()}
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

export default CashOutflowsPage;
