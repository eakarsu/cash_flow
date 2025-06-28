import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../../components/SEO/SEOHead.tsx';

const IntegrationPage: React.FC = () => {
  const navigate = useNavigate();

  const handleConnectQuickBooks = () => {
    navigate('/integration/quickbooks');
  };

  return (
    <>
      <SEOHead
        title="Integrations - Cash Flow Manager"
        description="Connect your accounting software and financial tools with Cash Flow Manager"
        keywords="integrations, quickbooks, accounting software, financial tools"
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Integrations
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connect your favorite accounting and financial tools to streamline your cash flow management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* QuickBooks Integration */}
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                QuickBooks Online
              </h3>
              <p className="text-gray-600 mb-4 text-center">
                Sync your QuickBooks data automatically for real-time cash flow insights
              </p>
              <div className="text-center">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
                  Connect QuickBooks
                </button>
              </div>
            </div>

            {/* Placeholder for future integrations */}
            <div className="bg-white rounded-lg shadow-md p-6 opacity-50">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gray-400 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Xero
              </h3>
              <p className="text-gray-600 mb-4 text-center">
                Coming soon - Connect your Xero accounting data
              </p>
              <div className="text-center">
                <button className="bg-gray-400 text-white px-6 py-2 rounded-md font-medium cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 opacity-50">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-gray-400 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Bank Connections
              </h3>
              <p className="text-gray-600 mb-4 text-center">
                Coming soon - Direct bank account integration
              </p>
              <div className="text-center">
                <button className="bg-gray-400 text-white px-6 py-2 rounded-md font-medium cursor-not-allowed">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          <div className="mt-16 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Why Use Integrations?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Automatic Sync</h3>
                <p className="text-gray-600">
                  Your financial data updates automatically, saving you time and reducing errors
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Insights</h3>
                <p className="text-gray-600">
                  Get up-to-date cash flow analysis and forecasting based on your latest data
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Connection</h3>
                <p className="text-gray-600">
                  Bank-level security ensures your financial data remains safe and protected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IntegrationPage;
