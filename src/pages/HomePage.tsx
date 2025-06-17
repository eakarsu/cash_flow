import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, TrendingUp, DollarSign, BarChart3, Calendar } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext.tsx';
import CashInflowsWidget from '../components/Dashboard/CashInflowsWidget.tsx';
import CashOutflowsWidget from '../components/Dashboard/CashOutflowsWidget.tsx';
import CashRunwayWidget from '../components/Dashboard/CashRunwayWidget.tsx';
import CashForecastWidget from '../components/Dashboard/CashForecastWidget.tsx';

const HomePage: React.FC = () => {
  const { transactions } = useTransactions();

  const recentTransactions = transactions.slice(0, 5);
  const totalBalance = transactions.length > 0 ? 
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].balance : 0;
  const monthlyInflow = transactions
    .filter(t => t.amount > 0 && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyOutflow = transactions
    .filter(t => t.amount < 0 && new Date(t.date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Cash Flow Dashboard</h1>
            <p className="text-xl text-primary-100 mb-8">
              Monitor, analyze, and forecast your business cash flow with precision
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/transactions/add"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-5 w-5 inline mr-2" />
                Add Transaction
              </Link>
              <Link
                to="/transactions/import"
                className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors"
              >
                <Upload className="h-5 w-5 inline mr-2" />
                Import Data
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalBalance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Inflow</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${monthlyInflow.toLocaleString()}
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
                <p className="text-sm font-medium text-gray-600">Monthly Outflow</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${monthlyOutflow.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(monthlyInflow - monthlyOutflow).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transaction data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by importing your transaction data or adding transactions manually.
            </p>
            <div className="mt-6 flex justify-center space-x-4">
              <Link
                to="/transactions/import"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Import CSV
              </Link>
              <Link
                to="/transactions/add"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard Widgets */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <CashInflowsWidget transactions={transactions} />
              <CashOutflowsWidget transactions={transactions} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <CashRunwayWidget transactions={transactions} />
              <CashForecastWidget transactions={transactions} />
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                  <Link
                    to="/transactions"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View all
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {recentTransactions.map((transaction) => (
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
          </>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/analytics/forecast"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">13-Week Forecast</h3>
                <p className="text-sm text-gray-500">Plan your cash flow for the next quarter</p>
              </div>
            </div>
          </Link>

          <Link
            to="/reports"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Financial Reports</h3>
                <p className="text-sm text-gray-500">Generate detailed financial reports</p>
              </div>
            </div>
          </Link>

          <Link
            to="/transactions/import"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Import Data</h3>
                <p className="text-sm text-gray-500">Upload transactions from CSV files</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default HomePage;
