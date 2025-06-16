import React from 'react';
import { DollarSign, Upload, Download } from 'lucide-react';

interface HeaderProps {
  onImport: () => void;
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onImport, onExport }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-primary-600" />
            <h1 className="ml-2 text-xl font-semibold text-gray-900">
              Cash Flow Manager
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={onImport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700
bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </button>

            <button
              onClick={onExport}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;