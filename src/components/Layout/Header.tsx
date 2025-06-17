import React, { useState } from 'react';
import { DollarSign, Menu, X, ChevronDown, User, LogOut, Upload, Download } from 'lucide-react';

interface HeaderProps {
  onImport?: () => void;
  onExport?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onImport, onExport }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Mock auth state

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
            <DollarSign className="h-8 w-8 text-primary-600" />
            <h1 className="ml-2 text-xl font-semibold text-gray-900">
              Cash Flow Manager
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <button className="text-sm font-medium text-gray-700 hover:text-primary-600">
              Dashboard
            </button>

            {/* Analytics Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsAnalyticsOpen(!isAnalyticsOpen)}
                className="flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                Analytics
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              {isAnalyticsOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    Cash Inflows
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    Cash Outflows
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    Cash Runway
                  </button>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsAnalyticsOpen(false)}
                  >
                    13-Week Forecast
                  </button>
                </div>
              )}
            </div>

            <button className="text-sm font-medium text-gray-700 hover:text-primary-600">
              Transactions
            </button>

            <button className="text-sm font-medium text-gray-700 hover:text-primary-600">
              Reports
            </button>

            <button className="text-sm font-medium text-gray-700 hover:text-primary-600">
              Features
            </button>

            <button className="text-sm font-medium text-gray-700 hover:text-primary-600">
              Pricing
            </button>

            <button className="text-sm font-medium text-gray-700 hover:text-primary-600">
              Help
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {onImport && (
              <button
                onClick={onImport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </button>
            )}

            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            )}

            {/* User Account / Auth */}
            <div className="hidden lg:flex items-center space-x-4">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-primary-600"
                  >
                    <User className="h-5 w-5 mr-1" />
                    Account
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  {isAccountOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Profile
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Settings
                      </button>
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Billing
                      </button>
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
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Cash Inflows
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Cash Outflows
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Forecast
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Transactions
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Reports
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </button>
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Help
              </button>
              {isLoggedIn && (
                <>
                  <hr className="my-2" />
                  <button
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:text-primary-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </button>
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
