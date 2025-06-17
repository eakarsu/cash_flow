import React from 'react';
import { Clock, DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import CashRunwayWidget from '../../components/Dashboard/CashRunwayWidget';

const CashRunwayPage: React.FC = () => {
  const { transactions } = useTransactions();
  
  const currentBalance = transactions.length > 0 ? transactions[0].balance : 0;
  const monthlyOutflows = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) / Math.max(1, new Set(transactions.map(t => t.date.substring(0, 7))).size);
  
  const runwayMonths = monthlyOutflows > 0 ? currentBalance / monthlyOutflows : Infinity;
  const runwayWeeks = runwayMonths * 4.33;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Clock className="h-8 w-8 text-orange-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Cash Runway Analysis</h1>
          </div>
          <p className="text-gray-600">
            Monitor how long your current cash will last at the current burn rate
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
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${currentBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Burn Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${monthlyOutflows.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${runwayMonths < 3 ? 'bg-red-100' : runwayMonths < 6 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <Clock className={`h-6 w-6 ${runwayMonths < 3 ? 'text-red-600' : runwayMonths < 6 ? 'text-yellow-600' : 'text-green-600'}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cash Runway</p>
                <p className="text-2xl font-bold text-gray-900">
                  {runwayMonths === Infinity ? '∞' : `${Math.floor(runwayMonths)}mo`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Runway Alert */}
        {runwayMonths < 6 && runwayMonths !== Infinity && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {runwayMonths < 3 ? 'Critical Cash Runway Warning' : 'Low Cash Runway Alert'}
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  At your current burn rate, you have approximately {Math.floor(runwayWeeks)} weeks of runway remaining.
                  Consider reducing expenses or increasing revenue.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Runway Widget */}
        <div className="mb-8">
          <CashRunwayWidget transactions={transactions} />
        </div>

        {/* Scenario Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Runway Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900 mb-2">Pessimistic (20% higher burn)</h4>
              <p className="text-2xl font-bold text-red-600">
                {monthlyOutflows > 0 ? `${Math.floor(currentBalance / (monthlyOutflows * 1.2))}mo` : '∞'}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Current Burn Rate</h4>
              <p className="text-2xl font-bold text-blue-600">
                {runwayMonths === Infinity ? '∞' : `${Math.floor(runwayMonths)}mo`}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Optimistic (20% lower burn)</h4>
              <p className="text-2xl font-bold text-green-600">
                {monthlyOutflows > 0 ? `${Math.floor(currentBalance / (monthlyOutflows * 0.8))}mo` : '∞'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashRunwayPage;
