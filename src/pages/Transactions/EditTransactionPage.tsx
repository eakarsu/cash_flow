import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import TransactionForm from '../../components/TransactionManager/TransactionForm';

const EditTransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { transactions, updateTransaction } = useTransactions();

  const transaction = transactions.find(t => t.id === id);

  const handleSave = (transactionData: any) => {
    if (id) {
      updateTransaction(id, transactionData);
      navigate('/transactions');
    }
  };

  const handleCancel = () => {
    navigate('/transactions');
  };

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
          <p className="text-gray-600 mb-4">The transaction you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/transactions')}
            className="text-primary-600 hover:text-primary-700"
          >
            Back to Transactions
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Transaction</h1>
          <p className="text-gray-600">Update the transaction details</p>
        </div>

        {/* Transaction Form */}
        <div className="bg-white rounded-lg shadow">
          <TransactionForm
            transaction={transaction}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
};

export default EditTransactionPage;
