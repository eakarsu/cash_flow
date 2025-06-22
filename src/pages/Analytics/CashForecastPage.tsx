import React from 'react';
import { Calendar, TrendingUp, BarChart3, Target } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext.tsx';
import CashForecastWidget from '../../components/Dashboard/CashForecastWidget.tsx';

const CashForecastPage: React.FC = () => {
  const { transactions } = useTransactions();
  
  // Calculate current balance manually by sorting transactions chronologically and summing amounts
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentBalance = sortedTransactions.reduce((balance, transaction) => balance + transaction.amount, 0);
  const avgMonthlyInflow = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0) / Math.max(1, new Set(transactions.map(t => t.date.substring(0, 7))).size);
  const avgMonthlyOutflow = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) / Math.max(1, new Set(transactions.map(t => t.date.substring(0, 7))).size);
  
  const netCashFlow = avgMonthlyInflow - avgMonthlyOutflow;
  const projectedBalance13Weeks = currentBalance + (netCashFlow * 3); // 13 weeks ≈ 3 months

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">13-Week Cash Forecast</h1>
          </div>
          <p className="text-gray-600">
            Project your cash flow for the next 13 weeks based on historical trends
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Latest Transaction Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${currentBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
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
              <div className="p-2 bg-red-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-red-600" />
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
              <div className={`p-2 rounded-lg ${projectedBalance13Weeks > currentBalance ? 'bg-green-100' : 'bg-red-100'}`}>
                <Target className={`h-6 w-6 ${projectedBalance13Weeks > currentBalance ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">13-Week Projection</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${projectedBalance13Weeks.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="mb-8">
          <CashForecastWidget transactions={transactions} />
        </div>

        {/* Forecast Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Forecast Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Net Monthly Cash Flow:</span>
                <span className={`text-sm font-medium ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netCashFlow >= 0 ? '+' : ''}${netCashFlow.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Projected Change (13 weeks):</span>
                <span className={`text-sm font-medium ${projectedBalance13Weeks - currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {projectedBalance13Weeks - currentBalance >= 0 ? '+' : ''}${(projectedBalance13Weeks - currentBalance).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Growth Rate:</span>
                <span className={`text-sm font-medium ${projectedBalance13Weeks > currentBalance ? 'text-green-600' : 'text-red-600'}`}>
                  {currentBalance > 0 ? `${(((projectedBalance13Weeks - currentBalance) / currentBalance) * 100).toFixed(1)}%` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Assumptions</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Forecast based on historical transaction patterns</li>
              <li>• Assumes current trends continue unchanged</li>
              <li>• Does not account for seasonal variations</li>
              <li>• Excludes one-time events or planned changes</li>
              <li>• Should be updated regularly as new data becomes available</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashForecastPage;
