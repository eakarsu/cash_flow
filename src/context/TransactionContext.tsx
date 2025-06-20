import React, { createContext, useContext, ReactNode } from 'react';
import { Transaction } from '../types/index';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';

interface TransactionContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => void;
  replaceAllTransactions: (newTransactions: Transaction[]) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};

interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  // Check if there are any existing transactions in localStorage
  const getInitialTransactions = (): Transaction[] => {
    try {
      const stored = localStorage.getItem('transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If we have stored transactions, use them (could be imported data)
          console.log('📊 Loading existing transactions from localStorage:', parsed.length);
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error reading transactions from localStorage:', error);
    }
    
    // Only return sample data if no transactions exist
    console.log('📊 No existing transactions found, using sample data');
    return [
      {
        id: 'sample-1',
        date: '2024-06-01',
        description: 'Revenue - Client A',
        amount: 5000,
        type: 'inflow' as const,
        category: 'Revenue',
        balance: 15000
      },
      {
        id: 'sample-2',
        date: '2024-06-05',
        description: 'Office Rent',
        amount: 2000,
        type: 'outflow' as const,
        category: 'Rent',
        balance: 13000
      },
      {
        id: 'sample-3',
        date: '2024-06-10',
        description: 'Marketing Campaign',
        amount: 800,
        type: 'outflow' as const,
        category: 'Marketing',
        balance: 12200
      },
      {
        id: 'sample-4',
        date: '2024-06-15',
        description: 'Revenue - Client B',
        amount: 3500,
        type: 'inflow' as const,
        category: 'Revenue',
        balance: 15700
      },
      {
        id: 'sample-5',
        date: '2024-05-01',
        description: 'Revenue - Client C',
        amount: 4200,
        type: 'inflow' as const,
        category: 'Revenue',
        balance: 10000
      },
      {
        id: 'sample-6',
        date: '2024-05-15',
        description: 'Software Subscriptions',
        amount: 500,
        type: 'outflow' as const,
        category: 'Software',
        balance: 9500
      }
    ];
  };

  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', getInitialTransactions());

  const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, transactionData: Omit<Transaction, 'id'>) => {
    setTransactions(prev =>
      prev.map(t => t.id === id ? { ...transactionData, id } : t)
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const clearAllTransactions = () => {
    console.log('🗑️ Clearing all transactions');
    localStorage.removeItem('transactions');
    setTransactions([]);
  };

  const replaceAllTransactions = (newTransactions: Transaction[]) => {
    console.log('🔄 Replacing all transactions with', newTransactions.length, 'new transactions');
    localStorage.removeItem('transactions');
    setTransactions(newTransactions);
  };

  const value = {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    replaceAllTransactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
