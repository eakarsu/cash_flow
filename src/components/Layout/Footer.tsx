import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary-400" />
              <span className="ml-2 text-xl font-bold">Cash Flow Manager</span>
            </div>
            <p className="text-gray-300 text-sm">
              Professional cash flow management and forecasting tools for businesses of all sizes.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-300">
                <Mail className="h-4 w-4 mr-2" />
                <span>support@cashflowapp.app</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white text-sm">Dashboard</Link></li>
              <li><Link to="/transactions" className="text-gray-300 hover:text-white text-sm">Transactions</Link></li>
              <li><Link to="/reports" className="text-gray-300 hover:text-white text-sm">Reports</Link></li>
              <li><Link to="/analytics/forecast" className="text-gray-300 hover:text-white text-sm">Forecasting</Link></li>
              <li><Link to="/operations" className="text-gray-300 hover:text-white text-sm">Controls &amp; Audit</Link></li>
              <li><Link to="/integration" className="text-gray-300 hover:text-white text-sm">Licensed Sources</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Governance</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-gray-300 hover:text-white text-sm">Privacy Policy</Link></li>
              <li><Link to="/data-processing" className="text-gray-300 hover:text-white text-sm">Data Processing</Link></li>
              <li><a href="/api/v1/audit-export" className="text-gray-300 hover:text-white text-sm">Verified Audit Export</a></li>
              <li><Link to="/operations" className="text-gray-300 hover:text-white text-sm">Incident Controls</Link></li>
            </ul>
          </div>

          {/* Operational boundary */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Operational boundary</h3>
            <p className="text-gray-300 text-sm mb-4">
              Source balances remain with licensed banks and brokers. This application records an auditable ledger and supports paper trading only; it never takes custody or sends live orders.
            </p>
          </div>
        </div>

        {/* Social Media & Legal */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 text-sm text-gray-400 md:mb-0">Paper-only financial operations</p>
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-white">Terms of Service</Link>
              <Link to="/cookies" className="hover:text-white">Cookie Policy</Link>
              <Link to="/refund-policy" className="hover:text-white">Refund Policy</Link>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Cash Flow Manager. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
