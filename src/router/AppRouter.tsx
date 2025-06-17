import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import HomePage from '../pages/HomePage';
import PlaceholderPage from '../components/PlaceholderPage';

// Import only the pages that actually exist
import TransactionsPage from '../pages/Transactions/TransactionsPage';
import AddTransactionPage from '../pages/Transactions/AddTransactionPage';
import EditTransactionPage from '../pages/Transactions/EditTransactionPage';
import ImportTransactionsPage from '../pages/Transactions/ImportTransactionsPage';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
            {/* Main Application Pages */}
            <Route path="/" element={<HomePage />} />
            
            {/* Analytics Pages - Using PlaceholderPage for now */}
            <Route path="/analytics/inflows" element={<PlaceholderPage title="Cash Inflows Analysis" description="Analyze your incoming cash flows and revenue streams" />} />
            <Route path="/analytics/outflows" element={<PlaceholderPage title="Cash Outflows Analysis" description="Track and analyze your business expenses" />} />
            <Route path="/analytics/runway" element={<PlaceholderPage title="Cash Runway Analysis" description="See how long your current cash will last" />} />
            <Route path="/analytics/forecast" element={<PlaceholderPage title="13-Week Cash Forecast" description="Plan your cash flow for the next quarter" />} />
            
            {/* Transaction Management Pages */}
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/add" element={<AddTransactionPage />} />
            <Route path="/transactions/edit/:id" element={<EditTransactionPage />} />
            <Route path="/transactions/import" element={<ImportTransactionsPage />} />
            <Route path="/transactions/categories" element={<PlaceholderPage title="Transaction Categories" description="Manage and organize your transaction categories" />} />
            
            {/* Reports Pages - Using PlaceholderPage for now */}
            <Route path="/reports" element={<PlaceholderPage title="Financial Reports" description="Generate comprehensive financial reports" />} />
            <Route path="/reports/custom" element={<PlaceholderPage title="Custom Reports" description="Create custom financial reports" />} />
            <Route path="/reports/export" element={<PlaceholderPage title="Export Data" description="Export your financial data in various formats" />} />
            
            {/* Account Pages - Using PlaceholderPage for now */}
            <Route path="/account/profile" element={<PlaceholderPage title="User Profile" description="Manage your account profile and personal information" />} />
            <Route path="/account/settings" element={<PlaceholderPage title="Account Settings" description="Configure your account preferences and settings" />} />
            <Route path="/account/billing" element={<PlaceholderPage title="Billing & Subscription" description="Manage your subscription and billing information" />} />
            
            {/* Company Pages - Using PlaceholderPage for now */}
            <Route path="/about" element={<PlaceholderPage title="About Us" description="Learn more about our company and mission" />} />
            <Route path="/contact" element={<PlaceholderPage title="Contact Us" description="Get in touch with our team" />} />
            
            {/* Marketing Pages - Using PlaceholderPage for now */}
            <Route path="/features" element={<PlaceholderPage title="Features" description="Explore all the powerful features of our platform" />} />
            <Route path="/pricing" element={<PlaceholderPage title="Pricing Plans" description="Choose the perfect plan for your business" />} />
            <Route path="/testimonials" element={<PlaceholderPage title="Customer Testimonials" description="See what our customers are saying about us" />} />
            <Route path="/case-studies" element={<PlaceholderPage title="Case Studies" description="Real-world examples of how our platform helps businesses" />} />
            <Route path="/blog" element={<PlaceholderPage title="Blog" description="Latest insights and tips for cash flow management" />} />
            
            {/* Support Pages - Using PlaceholderPage for now */}
            <Route path="/help" element={<PlaceholderPage title="Help Center" description="Find answers to frequently asked questions" />} />
            <Route path="/documentation" element={<PlaceholderPage title="Documentation" description="Comprehensive guides and API documentation" />} />
            <Route path="/tutorials" element={<PlaceholderPage title="Video Tutorials" description="Learn how to use our platform with step-by-step videos" />} />
            <Route path="/support" element={<PlaceholderPage title="Contact Support" description="Get help from our support team" />} />
            
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
