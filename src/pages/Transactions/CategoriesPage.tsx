import React from 'react';
import { Tag } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <Tag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Categories</h1>
          <p className="text-gray-600">Manage your transaction categories</p>
          <p className="text-sm text-gray-500 mt-4">This page is under development.</p>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
