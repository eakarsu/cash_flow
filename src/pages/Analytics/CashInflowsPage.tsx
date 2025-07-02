import React from 'react';
import { TrendingUp, DollarSign, Calendar, Filter } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import CashInflowsWidget from '../../components/Dashboard/CashInflowsWidget';

const CashInflowsPage: React.FC = () => {
  const { transactions } = useTransactions();
  
  const inflowTransactions = transactions.filter(t => t.amount > 0);
  const totalInflows = inflowTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgMonthlyInflow = totalInflows / Math.max(1, new Set(inflowTransactions.map(t => t.date.substring(0, 7))).size);
  
  const categoryBreakdown = inflowTransactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Cash Inflows Analysis</h1>
          </div>
          <p className="text-gray-600">
            Detailed analysis of your revenue streams and cash inflows
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
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
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Monthly Inflow</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${avgMonthlyInflow.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Revenue Streams</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(categoryBreakdown).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          <CashInflowsWidget transactions={transactions} />
          
          {/* Category Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inflow by Category</h3>
            <div className="space-y-4">
              {Object.entries(categoryBreakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <span className="text-sm font-bold text-green-600">
                      ${amount.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Inflow Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Inflow Transactions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {inflowTransactions.slice(0, 10).map((transaction) => (
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
                    <p className="text-sm font-medium text-green-600">
                      +${transaction.amount.toLocaleString()}
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

export default CashInflowsPage;
