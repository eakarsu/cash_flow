import React, { createContext, useContext, ReactNode } from 'react';
import { Transaction } from '../types/index';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface TransactionContextType {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
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
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', [
    {
      id: 'sample-1',
      date: '2024-06-01',
      description: 'Revenue - Client A',
      amount: 5000,
      type: 'income',
      category: 'Revenue',
      balance: 15000
    },
    {
      id: 'sample-2',
      date: '2024-06-05',
      description: 'Office Rent',
      amount: -2000,
      type: 'expense',
      category: 'Rent',
      balance: 13000
    },
    {
      id: 'sample-3',
      date: '2024-06-10',
      description: 'Marketing Campaign',
      amount: -800,
      type: 'expense',
      category: 'Marketing',
      balance: 12200
    },
    {
      id: 'sample-4',
      date: '2024-06-15',
      description: 'Revenue - Client B',
      amount: 3500,
      type: 'income',
      category: 'Revenue',
      balance: 15700
    },
    {
      id: 'sample-5',
      date: '2024-05-01',
      description: 'Revenue - Client C',
      amount: 4200,
      type: 'income',
      category: 'Revenue',
      balance: 10000
    },
    {
      id: 'sample-6',
      date: '2024-05-15',
      description: 'Software Subscriptions',
      amount: -500,
      type: 'expense',
      category: 'Software',
      balance: 9500
    }
  ]);

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

  const value = {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
