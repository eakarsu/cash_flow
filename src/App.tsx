import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import Header from './components/Layout/Header.tsx';
import CashInflowsWidget from './components/Dashboard/CashInflowsWidget.tsx';
import CashOutflowsWidget from './components/Dashboard/CashOutflowsWidget.tsx';
import CashRunwayWidget from './components/Dashboard/CashRunwayWidget.tsx';
import CashForecastWidget from './components/Dashboard/CashForecastWidget.tsx';
import TransactionList from './components/TransactionManager/TransactionList.tsx';
import TransactionForm from './components/TransactionManager/TransactionForm.tsx';
import { Transaction } from './types/index.ts';
import { useLocalStorage } from './hooks/useLocalStorage.ts';
import { parseCSV, exportToCSV } from './utils/csvParser.ts';

function App() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', [
    {
      id: 'sample-1',
      date: '2024-06-01',
      description: 'Revenue - Client A',
      amount: 5000,
      category: 'Revenue',
      balance: 15000
    },
    {
      id: 'sample-2',
      date: '2024-06-05',
      description: 'Office Rent',
      amount: -2000,
      category: 'Rent',
      balance: 13000
    },
    {
      id: 'sample-3',
      date: '2024-06-10',
      description: 'Marketing Campaign',
      amount: -800,
      category: 'Marketing',
      balance: 12200
    },
    {
      id: 'sample-4',
      date: '2024-06-15',
      description: 'Revenue - Client B',
      amount: 3500,
      category: 'Revenue',
      balance: 15700
    },
    {
      id: 'sample-5',
      date: '2024-05-01',
      description: 'Revenue - Client C',
      amount: 4200,
      category: 'Revenue',
      balance: 10000
    },
    {
      id: 'sample-6',
      date: '2024-05-15',
      description: 'Software Subscriptions',
      amount: -500,
      category: 'Software',
      balance: 9500
    }
  ]);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions'>('dashboard');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const importedTransactions = await parseCSV(file);
        setTransactions(prev => {
          // Merge with existing transactions, avoiding duplicates
          const existingIds = new Set(prev.map(t => t.id));
          const newTransactions = importedTransactions.filter(t => !existingIds.has(t.id));
          return [...prev, ...newTransactions].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });
        alert(`Successfully imported ${importedTransactions.length} transactions`);
      } catch (error) {
        console.error('Error importing CSV:', error);
        alert('Error importing CSV file. Please check the format and try again.');
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    exportToCSV(transactions, `cash-flow-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleSaveTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      // Update existing transaction
      setTransactions(prev =>
        prev.map(t => t.id === editingTransaction.id
          ? { ...transactionData, id: editingTransaction.id }
          : t
        )
      );
    } else {
      // Add new transaction
      const newTransaction: Transaction = {
        ...transactionData,
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setTransactions(prev => [newTransaction, ...prev]);
    }

    setShowTransactionForm(false);
    setEditingTransaction(undefined);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleCancelForm = () => {
    setShowTransactionForm(false);
    setEditingTransaction(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onImport={handleImport} onExport={handleExport} />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transactions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Transactions
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            {/* Dashboard Widgets */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <CashInflowsWidget transactions={transactions} />
              <CashOutflowsWidget transactions={transactions} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <CashRunwayWidget transactions={transactions} />
              <CashForecastWidget transactions={transactions} />
            </div>

            {transactions.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002
2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0
01-2-2z" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transaction data</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by importing your transaction data or adding transactions manually.
                </p>
                <div className="mt-6 flex justify-center space-x-4">
                  <button
                    onClick={handleImport}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
bg-primary-600 hover:bg-primary-700"
                  >
                    Import CSV
                  </button>
                  <button
                    onClick={() => setShowTransactionForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700
bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Transaction Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Transaction Management</h2>
                <p className="text-gray-600">Manage your cash flow transactions</p>
              </div>
              <button
                onClick={() => setShowTransactionForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white
bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </button>
            </div>

            {/* Transaction List */}
            <TransactionList
              transactions={transactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </div>
        )}
      </main>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          transaction={editingTransaction}
          onSave={handleSaveTransaction}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}

export default App;
