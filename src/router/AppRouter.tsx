import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import HomePage from '../pages/HomePage';

// Transaction pages
import TransactionsPage from '../pages/Transactions/TransactionsPage';
import AddTransactionPage from '../pages/Transactions/AddTransactionPage';
import EditTransactionPage from '../pages/Transactions/EditTransactionPage';
import ImportTransactionsPage from '../pages/Transactions/ImportTransactionsPage';

// Analytics pages
const CashInflowsPage = React.lazy(() => import('../pages/Analytics/CashInflowsPage'));
const CashOutflowsPage = React.lazy(() => import('../pages/Analytics/CashOutflowsPage'));
const CashRunwayPage = React.lazy(() => import('../pages/Analytics/CashRunwayPage'));
const CashForecastPage = React.lazy(() => import('../pages/Analytics/CashForecastPage'));
const VendorCashCommitmentsPage = React.lazy(() => import('../pages/Analytics/VendorCashCommitmentsPage'));

// Reports pages
import ReportsPage from '../pages/Reports/ReportsPage';

// Integration pages
import IntegrationPage from '../pages/Integration/IntegrationPage';

import LoginPage from '../pages/LoginPage';
import OperationsPage from '../pages/OperationsPage';
import { useAuth } from '../context/AuthContext';
import PrivacyPolicyPage from '../pages/Legal/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/Legal/TermsOfServicePage';
import CookiePolicyPage from '../pages/Legal/CookiePolicyPage';
import DataProcessingPage from '../pages/Legal/DataProcessingPage';
import RefundPolicyPage from '../pages/Legal/RefundPolicyPage';

const AppRouter: React.FC = () => {
  const { authenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-slate-950 p-12 text-center text-slate-100">Checking secure session…</div>;

  const handleImport = () => {
    // Navigate to import page instead of handling file upload here
    window.location.href = '/transactions/import';
  };


  return (
    <Router>
      {!authenticated ? (
        <Routes><Route path="/login" element={<LoginPage />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>
      ) : <Layout onImport={handleImport}><React.Suspense fallback={<p className="p-8 text-center text-gray-600">Loading financial view…</p>}>
        <Routes>
            <Route path="/login" element={<Navigate to="/" replace />} />
            {/* Main Application Pages */}
            <Route path="/" element={<HomePage />} />
            
            {/* Analytics Pages */}
            <Route path="/analytics/inflows" element={<CashInflowsPage />} />
            <Route path="/analytics/outflows" element={<CashOutflowsPage />} />
            <Route path="/analytics/runway" element={<CashRunwayPage />} />
            <Route path="/analytics/forecast" element={<CashForecastPage />} />
            <Route path="/analytics/vendor-commitments" element={<VendorCashCommitmentsPage />} />
            
            {/* Transaction Management Pages */}
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/add" element={<AddTransactionPage />} />
            <Route path="/transactions/edit/:id" element={<EditTransactionPage />} />
            <Route path="/transactions/import" element={<ImportTransactionsPage />} />
            <Route path="/transactions/categories" element={<Navigate to="/transactions" replace />} />
            
            {/* Integration Pages */}
            <Route path="/integration" element={<IntegrationPage />} />
            <Route path="/integration/quickbooks" element={<Navigate to="/integration" replace />} />
            
            {/* Reports Pages */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/reports/custom" element={<Navigate to="/reports" replace />} />
            <Route path="/reports/export" element={<Navigate to="/operations" replace />} />
            
            {/* Account Pages */}
            <Route path="/account/profile" element={<Navigate to="/operations" replace />} />
            <Route path="/account/settings" element={<Navigate to="/operations" replace />} />
            <Route path="/account/billing" element={<Navigate to="/operations" replace />} />
            
            {/* Company Pages */}
            <Route path="/about" element={<Navigate to="/operations" replace />} />
            <Route path="/contact" element={<Navigate to="/operations" replace />} />
            
            {/* Marketing Pages */}
            <Route path="/features" element={<Navigate to="/operations" replace />} />
            <Route path="/pricing" element={<Navigate to="/operations" replace />} />
            <Route path="/testimonials" element={<Navigate to="/operations" replace />} />
            <Route path="/case-studies" element={<Navigate to="/operations" replace />} />
            <Route path="/blog" element={<Navigate to="/operations" replace />} />
            
            {/* Support Pages */}
            <Route path="/help" element={<Navigate to="/operations" replace />} />
            <Route path="/documentation" element={<Navigate to="/operations" replace />} />
            <Route path="/tutorials" element={<Navigate to="/operations" replace />} />
            <Route path="/support" element={<Navigate to="/operations" replace />} />
            
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/data-processing" element={<DataProcessingPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </React.Suspense></Layout>}
    </Router>
  );
};

export default AppRouter;
