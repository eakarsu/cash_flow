import React,{useState, useEffect, useCallback} from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, TrendingUp, DollarSign, BarChart3, Calendar, Star, Users, Shield, Zap } from 'lucide-react';
import { useTransactions } from '../context/TransactionContext';
const CashInflowsWidget = React.lazy(() => import('../components/Dashboard/CashInflowsWidget'));
const CashOutflowsWidget = React.lazy(() => import('../components/Dashboard/CashOutflowsWidget'));
const CashRunwayWidget = React.lazy(() => import('../components/Dashboard/CashRunwayWidget'));
const CashForecastWidget = React.lazy(() => import('../components/Dashboard/CashForecastWidget'));
import ErrorBoundary from './ErrorBoundary';

const HomePage: React.FC = () => {
  const { transactions } = useTransactions();

  const recentTransactions = transactions.slice(0, 5);
  // Calculate total balance manually by sorting transactions chronologically and summing amounts
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalBalance = sortedTransactions.reduce((balance, transaction) => balance + transaction.amount, 0);
  // Calculate monthly inflow and outflow for current month using amount column
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const monthlyInflow = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.amount > 0 && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + t.amount, 0);
    
  const monthlyOutflow = transactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return t.amount < 0 && 
             transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const faqData = [
    {
      question: "What is cash flow management software?",
      answer: "Cash flow management software helps businesses track, analyze, and forecast their financial transactions to maintain healthy cash flow and make informed financial decisions."
    },
    {
      question: "How does Cash Flow Manager help my business?",
      answer: "The platform records source-timestamped transactions, reconciliations, deterministic forecasts, and paper-only risk decisions with audit evidence."
    },
    {
      question: "Is my financial data secure?",
      answer: "Production startup requires HTTPS and distinct strong secrets. Financial records remain in an append-only, hash-chained ledger; infrastructure operators must enable encrypted storage and backups."
    },
    {
      question: "Can I import data from my bank or accounting software?",
      answer: "Yes, Cash Flow Manager supports CSV imports from most banks and accounting software, making it easy to get started with your existing financial data."
    }
  ];


  return (
    <>
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Professional Cash Flow Management Made Simple
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Monitor, analyze, and forecast your business cash flow with precision. 
              Reconcile licensed source data, inspect deterministic forecasts, and test paper-only risk controls with a verifiable audit trail.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link
                to="/transactions/add"
                className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
                aria-label="Add new transaction to your cash flow"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Transaction
              </Link>
             
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-primary-200">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                <span className="text-sm">Hash-chained audit evidence</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                <span className="text-sm">Licensed-source boundaries</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                <span className="text-sm">Paper trading only</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" aria-labelledby="key-metrics-heading">
          <h2 id="key-metrics-heading" className="sr-only">Key Financial Metrics</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Latest Transaction Balance</p>
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
                <p className={`text-2xl font-bold ${(monthlyInflow - monthlyOutflow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(monthlyInflow - monthlyOutflow) >= 0 ? '+' : ''}${(monthlyInflow - monthlyOutflow).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

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
            <React.Suspense fallback={<p className="mb-8 rounded bg-white p-6 text-center text-gray-600">Loading deterministic analytics…</p>}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <CashInflowsWidget transactions={transactions} />
              <CashOutflowsWidget transactions={transactions} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
              <CashRunwayWidget transactions={transactions} />
              <CashForecastWidget transactions={transactions} />
            </div> 
            </React.Suspense>
            
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
                          Balance: ${sortedTransactions.slice(0, sortedTransactions.findIndex(t => t.id === transaction.id) + 1)
                            .reduce((balance, t) => balance + t.amount, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Features Section */}
        <section className="mt-16 mb-16" aria-labelledby="features-heading">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Cash Flow Manager?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to give you complete control over your business finances
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Insights</h3>
              <p className="text-gray-600">
                Get intelligent forecasting and recommendations powered by advanced machine learning algorithms
              </p>
            </article>
            
            <article className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Bank-Level Security</h3>
              <p className="text-gray-600">
                Your financial data is protected with enterprise-grade encryption and security protocols
              </p>
            </article>
            
            <article className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h3>
              <p className="text-gray-600">
                Comprehensive reporting and analytics to understand your financial performance
              </p>
            </article>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-16 mb-16" aria-labelledby="faq-heading">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto">
              {faqData.map((faq, index) => (
                <article key={index} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
          
          <Link
            to="/analytics/forecast"
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            aria-label="Access 13-week cash flow forecast"
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
            aria-label="Generate detailed financial reports"
          >
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Financial Reports</h3>
                <p className="text-sm text-gray-500">Generate detailed financial reports</p>
              </div>
            </div>
          </Link>

        </section>
      </main>
    </>
  );
};

export default HomePage;
