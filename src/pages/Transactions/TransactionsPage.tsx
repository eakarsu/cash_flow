import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, Download, Search } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import TransactionList from '../../components/TransactionManager/TransactionList';

const TransactionsPage: React.FC = () => {
  const { transactions, deleteTransaction } = useTransactions();

  const handleEdit = (transaction: any) => {
    // Navigate to edit page - this would be handled by router
    console.log('Edit transaction:', transaction);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
              <p className="text-gray-600">Manage and track all your cash flow transactions</p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/transactions/import"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Link>
              <Link
                to="/transactions/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Link>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <TransactionList
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={deleteTransaction}
        />
      </div>
    </div>
  );
};

export default TransactionsPage;
