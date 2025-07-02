import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { DollarSign, Menu, X, ChevronDown, User, LogOut } from 'lucide-react';

interface HeaderProps {
  onImport?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onImport }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Mock auth state
  const location = useLocation();
  
  const analyticsRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (analyticsRef.current && !analyticsRef.current.contains(event.target as Node)) {
        setIsAnalyticsOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsAnalyticsOpen(false);
    setIsAccountOpen(false);
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    setIsLoggedIn(false);
    // Add logout logic here
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Cash Flow Manager
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium ${
                isActive('/') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Dashboard
            </Link>

            {/* Analytics Dropdown */}
            <div className="relative" ref={analyticsRef}>
              <button
                onClick={() => {
                  setIsAnalyticsOpen(!isAnalyticsOpen);
                  setIsAccountOpen(false);
                }}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                Analytics
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {isAnalyticsOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    to="/analytics/inflows"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    Cash Inflows
                  </Link>
                  <Link
                    to="/analytics/outflows"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    Cash Outflows
                  </Link>
                  <Link
                    to="/analytics/runway"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    Cash Runway
                  </Link>
                  <Link
                    to="/analytics/forecast"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    13-Week Forecast
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/transactions"
              className={`text-sm font-medium ${
                isActive('/transactions') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Transactions
            </Link>

            <Link
              to="/integration"
              className={`text-sm font-medium ${
                isActive('/integration') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Integration
            </Link>

            <Link
              to="/reports"
              className={`text-sm font-medium ${
                isActive('/reports') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Reports
            </Link>

            <Link
              to="/features"
              className={`text-sm font-medium ${
                isActive('/features') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Features
            </Link>

            <Link
              to="/pricing"
              className={`text-sm font-medium ${
                isActive('/pricing') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Pricing
            </Link>

            <Link
              to="/about"
              className={`text-sm font-medium ${
                isActive('/about') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              About
            </Link>

            <Link
              to="/help"
              className={`text-sm font-medium ${
                isActive('/help') ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Help
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* User Account / Auth */}
            <div className="hidden lg:flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => {
                      setIsAccountOpen(!isAccountOpen);
                      setIsAnalyticsOpen(false);
                    }}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <User className="h-5 w-5 mr-1" />
                    Account
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {isAccountOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/account/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/account/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Settings
                      </Link>
                      <Link
                        to="/account/billing"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Billing
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <button className="text-sm font-medium text-gray-700 hover:text-primary-600">
                    Login
                  </button>
                  <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-primary-600"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <Link
                to="/"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/analytics/inflows"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Cash Inflows
              </Link>
              <Link
                to="/analytics/outflows"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Cash Outflows
              </Link>
              <Link
                to="/analytics/forecast"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Forecast
              </Link>
              <Link
                to="/transactions"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Transactions
              </Link>
              <Link
                to="/integration"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Integration
              </Link>
              <Link
                to="/reports"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Reports
              </Link>
              <Link
                to="/features"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/help"
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Help
              </Link>
              {isLoggedIn && (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/account/profile"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
