import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout.tsx';
import HomePage from '../pages/HomePage.tsx';
import PlaceholderPage from '../components/PlaceholderPage.tsx';
import { useTransactions } from '../context/TransactionContext.tsx';

// Transaction pages
import TransactionsPage from '../pages/Transactions/TransactionsPage.tsx';
import AddTransactionPage from '../pages/Transactions/AddTransactionPage.tsx';
import EditTransactionPage from '../pages/Transactions/EditTransactionPage.tsx';
import ImportTransactionsPage from '../pages/Transactions/ImportTransactionsPage.tsx';

// Analytics pages
import CashInflowsPage from '../pages/Analytics/CashInflowsPage.tsx';
import CashOutflowsPage from '../pages/Analytics/CashOutflowsPage.tsx';
import CashRunwayPage from '../pages/Analytics/CashRunwayPage.tsx';
import CashForecastPage from '../pages/Analytics/CashForecastPage.tsx';

// Reports pages
import ReportsPage from '../pages/Reports/ReportsPage.tsx';

// Company pages
import AboutPage from '../pages/Company/AboutPage.tsx';
import ContactPage from '../pages/Company/ContactPage.tsx';

// Marketing pages
import FeaturesPage from '../pages/Marketing/FeaturesPage.tsx';
import PricingPage from '../pages/Marketing/PricingPage.tsx';

// Support pages
import HelpPage from '../pages/Support/HelpPage.tsx';
import DocumentationPage from '../pages/Support/DocumentationPage.tsx';
import TutorialsPage from '../pages/Support/TutorialsPage.tsx';
import SupportContactPage from '../pages/Support/SupportContactPage.tsx';

const AppRouter: React.FC = () => {
  const { transactions } = useTransactions();

  const handleImport = () => {
    // Navigate to import page instead of handling file upload here
    window.location.href = '/transactions/import';
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Description', 'Amount', 'Category', 'Balance'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        t.date,
        `"${t.description}"`,
        t.amount,
        t.category,
        t.balance
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };


  return (
    <Router>
      <Layout onImport={handleImport} onExport={handleExport}>
        <Routes>
            {/* Main Application Pages */}
            <Route path="/" element={<HomePage />} />
            
            {/* Analytics Pages */}
            <Route path="/analytics/inflows" element={<CashInflowsPage />} />
            <Route path="/analytics/outflows" element={<CashOutflowsPage />} />
            <Route path="/analytics/runway" element={<CashRunwayPage />} />
            <Route path="/analytics/forecast" element={<CashForecastPage />} />
            
            {/* Transaction Management Pages */}
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/add" element={<AddTransactionPage />} />
            <Route path="/transactions/edit/:id" element={<EditTransactionPage />} />
            <Route path="/transactions/import" element={<ImportTransactionsPage />} />
            <Route path="/transactions/categories" element={<PlaceholderPage title="Transaction Categories" description="Manage and organize your transaction categories" />} />
            
            {/* Reports Pages */}
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/custom" element={<PlaceholderPage title="Custom Reports" description="Create custom financial reports" />} />
            <Route path="/reports/export" element={<PlaceholderPage title="Export Data" description="Export your financial data in various formats" />} />
            
            {/* Account Pages - Using PlaceholderPage for now */}
            <Route path="/account/profile" element={<PlaceholderPage title="User Profile" description="Manage your account profile and personal information" />} />
            <Route path="/account/settings" element={<PlaceholderPage title="Account Settings" description="Configure your account preferences and settings" />} />
            <Route path="/account/billing" element={<PlaceholderPage title="Billing & Subscription" description="Manage your subscription and billing information" />} />
            
            {/* Company Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            
            {/* Marketing Pages */}
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/testimonials" element={<PlaceholderPage title="Customer Testimonials" description="See what our customers are saying about us" />} />
            <Route path="/case-studies" element={<PlaceholderPage title="Case Studies" description="Real-world examples of how our platform helps businesses" />} />
            <Route path="/blog" element={<PlaceholderPage title="Blog" description="Latest insights and tips for cash flow management" />} />
            
            {/* Support Pages */}
            <Route path="/help" element={<HelpPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/tutorials" element={<TutorialsPage />} />
            <Route path="/support" element={<SupportContactPage />} />
            
            {/* Legal Pages - Using PlaceholderPage for now */}
            <Route path="/privacy" element={<PlaceholderPage title="Privacy Policy" description="Our commitment to protecting your privacy" />} />
            <Route path="/terms" element={<PlaceholderPage title="Terms of Service" description="Terms and conditions for using our service" />} />
            <Route path="/cookies" element={<PlaceholderPage title="Cookie Policy" description="How we use cookies on our website" />} />
            <Route path="/data-processing" element={<PlaceholderPage title="Data Processing Agreement" description="Information about how we process your data" />} />
            <Route path="/refund-policy" element={<PlaceholderPage title="Refund Policy" description="Our refund and cancellation policy" />} />
          </Routes>
      </Layout>
    </Router>
  );
};

export default AppRouter;
