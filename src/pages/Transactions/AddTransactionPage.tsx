import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext.tsx';
import TransactionForm from '../../components/TransactionManager/TransactionForm.tsx';

const AddTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { addTransaction } = useTransactions();

  const handleSave = (transactionData: any) => {
    addTransaction(transactionData);
    navigate('/transactions');
  };

  const handleCancel = () => {
    navigate('/transactions');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/transactions')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Transactions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add New Transaction</h1>
          <p className="text-gray-600">Enter the details for your new transaction</p>
        </div>

        {/* Transaction Form */}
        <div className="bg-white rounded-lg shadow">
          <TransactionForm
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default AddTransactionPage;
