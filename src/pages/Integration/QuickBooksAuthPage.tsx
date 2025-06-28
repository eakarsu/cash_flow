import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import SEOHead from '../../components/SEO/SEOHead.tsx';
import { useTransactions } from '../../context/TransactionContext.tsx';
import { API_ENDPOINTS, apiCall } from '../../config/api.ts';

interface AuthStatus {
  status: 'idle' | 'authorizing' | 'authorized' | 'importing' | 'success' | 'error';
  message?: string;
  error?: string;
}

const QuickBooksAuthPage: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ status: 'idle' });
  const [transactionCount, setTransactionCount] = useState(0);
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();

  const handleAuthorize = async () => {
    setAuthStatus({ status: 'authorizing', message: 'Getting authorization URL...' });
    
    try {
      console.log('🎯 Calling /api/quickbooks/auth endpoint...');
      console.log('🌐 Current window location:', window.location.origin);
      console.log('📡 Making request to: /api/quickbooks/auth (should proxy to port 3001)');
      
      // Call the authorization endpoint using centralized API config
      const authResponse = await apiCall(API_ENDPOINTS.QUICKBOOKS.AUTH, {
        method: 'GET',
      });

      console.log('📡 Response status:', authResponse.status);
      console.log('📡 Response headers:', authResponse.headers);
      console.log('📡 Response URL:', authResponse.url);
      
      // Check if response is actually JSON
      const contentType = authResponse.headers.get('content-type');
      console.log('📡 Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Response is not JSON, content-type:', contentType);
        const responseText = await authResponse.text();
        console.error('❌ Response body (first 500 chars):', responseText.substring(0, 500));
        throw new Error(`Server returned ${contentType} instead of JSON. The Express server may not have the /api/quickbooks route properly mounted.`);
      }

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error('❌ HTTP Error:', authResponse.status, errorText);
        throw new Error(`HTTP ${authResponse.status}: ${errorText}`);
      }

      const authData = await authResponse.json();
      console.log('✅ Auth response data:', authData);
      
      if (authData.success && authData.authUri) {
        console.log('🔗 QuickBooks Authorization URL (FULL):');
        console.log('URL START: ' + authData.authUri);
        console.log('URL LENGTH: ' + authData.authUri.length + ' characters');
        console.log('📋 Copy the COMPLETE URL above and paste it in your browser to complete authorization');
        console.log('🔗 COMPLETE URL: ' + authData.authUri);
        
        setAuthStatus({ 
          status: 'authorized', 
          message: 'Authorization URL generated! Check the browser console for the COMPLETE URL to complete authorization.' 
        });
      } else {
        throw new Error(authData.message || 'Failed to get authorization URL');
      }
    } catch (error) {
      setAuthStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to get authorization URL' 
      });
    }
  };

  const importTransactions = async () => {
    setAuthStatus({ status: 'importing', message: 'Importing transactions from QuickBooks...' });
    
    try {
      // Call the transactions endpoint using centralized API config
      const transactionsResponse = await apiCall(API_ENDPOINTS.QUICKBOOKS.TRANSACTIONS, {
        method: 'GET',
      });

      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transactionsData = await transactionsResponse.json();
      
      if (transactionsData.success && transactionsData.transactions) {
        // Process and add transactions to the context
        const transactions = transactionsData.transactions;
        setTransactionCount(transactions.length);
        
        // Add each transaction to the context
        transactions.forEach((transaction: any) => {
          addTransaction({
            id: transaction.id || Date.now().toString() + Math.random(),
            date: transaction.date,
            description: transaction.description || transaction.memo || 'QuickBooks Transaction',
            amount: transaction.amount,
            category: transaction.category || 'Uncategorized',
            balance: transaction.balance || 0,
            type: transaction.amount >= 0 ? 'income' : 'expense'
          });
        });

        setAuthStatus({ 
          status: 'success', 
          message: `Successfully imported ${transactions.length} transactions from QuickBooks!` 
        });
      } else {
        throw new Error(transactionsData.message || 'Failed to import transactions');
      }
    } catch (error) {
      setAuthStatus({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Failed to import transactions' 
      });
    }
  };

  const handlePullData = async () => {
    await importTransactions();
  };

  const handleRetry = () => {
    setAuthStatus({ status: 'idle' });
    setTransactionCount(0);
  };

  const handleGoToDashboard = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <>
      <SEOHead
        title="QuickBooks Authorization - Cash Flow Manager"
        description="Connect your QuickBooks account to automatically import transactions"
        keywords="quickbooks integration, accounting software, transaction import"
      />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={handleGoBack}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integrations
          </button>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Connect QuickBooks
              </h1>
              <p className="text-gray-600">
                Authorize access to your QuickBooks account to automatically import your transactions
              </p>
            </div>

            {/* Quick Data Pull Section */}
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Pull Transaction Data
                </h3>
                <p className="text-gray-600 mb-4">
                  Already connected? Click below to pull your latest transaction data from QuickBooks
                </p>
                <button
                  onClick={handlePullData}
                  disabled={authStatus.status === 'importing' || authStatus.status === 'authorizing'}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-colors inline-flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Pull Data from QuickBooks
                </button>
              </div>
            </div>

            {/* Status Display */}
            <div className="mb-8">
              {authStatus.status === 'idle' && (
                <div className="text-center">
                  <p className="text-gray-600 mb-6">
                    Click the button below to connect your QuickBooks account. You'll be redirected to QuickBooks to authorize access.
                  </p>
                  <button
                    onClick={handleAuthorize}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium text-lg transition-colors"
                  >
                    Authorize QuickBooks Access
                  </button>
                </div>
              )}

              {authStatus.status === 'authorizing' && (
                <div className="text-center">
                  <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">{authStatus.message}</p>
                </div>
              )}

              {authStatus.status === 'authorized' && (
                <div className="text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-4" />
                  <p className="text-green-600 font-medium">{authStatus.message}</p>
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>Next Steps:</strong>
                      <br />1. Open your browser's developer console (F12)
                      <br />2. Look for "COMPLETE URL:" in the console and copy the ENTIRE URL
                      <br />3. Paste the complete URL in a new browser tab to complete authorization
                      <br />4. Complete the QuickBooks authorization process in your browser
                      <br />5. After successful authorization, return here and click "Pull Data from QuickBooks"
                    </p>
                  </div>
                </div>
              )}

              {authStatus.status === 'importing' && (
                <div className="text-center">
                  <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">{authStatus.message}</p>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}

              {authStatus.status === 'success' && (
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Import Successful!</h2>
                  <p className="text-green-600 font-medium mb-4">{authStatus.message}</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-800">
                      <strong>{transactionCount}</strong> transactions have been imported and are now available in your dashboard.
                    </p>
                  </div>
                  <button
                    onClick={handleGoToDashboard}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-md font-medium text-lg transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              )}

              {authStatus.status === 'error' && (
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Failed</h2>
                  <p className="text-red-600 mb-6">{authStatus.error}</p>
                  <div className="space-x-4">
                    <button
                      onClick={handleRetry}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleGoBack}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Information Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <p className="text-gray-600">You'll be redirected to QuickBooks to authorize access</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-medium">2</span>
                  </div>
                  <p className="text-gray-600">We'll automatically import all your transactions</p>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-sm font-medium">3</span>
                  </div>
                  <p className="text-gray-600">Your cash flow analysis will be updated with real-time data</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-gray-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">
                    <strong>Secure Connection:</strong> We use bank-level security and OAuth 2.0 to protect your data. 
                    We only access transaction data and never store your QuickBooks login credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickBooksAuthPage;
