import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import HomePage from '../pages/HomePage';
import CashInflowsPage from '../pages/Analytics/CashInflowsPage';
import CashOutflowsPage from '../pages/Analytics/CashOutflowsPage';
import CashRunwayPage from '../pages/Analytics/CashRunwayPage';
import CashForecastPage from '../pages/Analytics/CashForecastPage';
import TransactionsPage from '../pages/Transactions/TransactionsPage';
import AddTransactionPage from '../pages/Transactions/AddTransactionPage';
import EditTransactionPage from '../pages/Transactions/EditTransactionPage';
import ImportTransactionsPage from '../pages/Transactions/ImportTransactionsPage';
import CategoriesPage from '../pages/Transactions/CategoriesPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import CustomReportPage from '../pages/Reports/CustomReportPage';
import ExportPage from '../pages/Reports/ExportPage';
import ProfilePage from '../pages/Account/ProfilePage';
import SettingsPage from '../pages/Account/SettingsPage';
import BillingPage from '../pages/Account/BillingPage';
import AboutPage from '../pages/Company/AboutPage';
import ContactPage from '../pages/Company/ContactPage';
import FeaturesPage from '../pages/Marketing/FeaturesPage';
import PricingPage from '../pages/Marketing/PricingPage';
import TestimonialsPage from '../pages/Marketing/TestimonialsPage';
import CaseStudiesPage from '../pages/Marketing/CaseStudiesPage';
import BlogPage from '../pages/Marketing/BlogPage';
import HelpPage from '../pages/Support/HelpPage';
import DocumentationPage from '../pages/Support/DocumentationPage';
import TutorialsPage from '../pages/Support/TutorialsPage';
import SupportContactPage from '../pages/Support/SupportContactPage';
import PrivacyPolicyPage from '../pages/Legal/PrivacyPolicyPage';
import TermsOfServicePage from '../pages/Legal/TermsOfServicePage';
import CookiePolicyPage from '../pages/Legal/CookiePolicyPage';
import DataProcessingPage from '../pages/Legal/DataProcessingPage';
import RefundPolicyPage from '../pages/Legal/RefundPolicyPage';

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Layout>
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
          <Route path="/transactions/categories" element={<CategoriesPage />} />
          
          {/* Reports Pages */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/custom" element={<CustomReportPage />} />
          <Route path="/reports/export" element={<ExportPage />} />
          
          {/* Account Pages */}
          <Route path="/account/profile" element={<ProfilePage />} />
          <Route path="/account/settings" element={<SettingsPage />} />
          <Route path="/account/billing" element={<BillingPage />} />
          
          {/* Company Pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          
          {/* Marketing Pages */}
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/case-studies" element={<CaseStudiesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          
          {/* Support Pages */}
          <Route path="/help" element={<HelpPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/tutorials" element={<TutorialsPage />} />
          <Route path="/support" element={<SupportContactPage />} />
          
          {/* Legal Pages */}
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/data-processing" element={<DataProcessingPage />} />
          <Route path="/refund-policy" element={<RefundPolicyPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default AppRouter;
