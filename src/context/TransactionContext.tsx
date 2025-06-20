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
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);

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
    console.log('🗑️ Clearing localStorage completely');
    localStorage.clear();
    setTransactions(newTransactions);
    // Force update localStorage immediately
    localStorage.setItem('transactions', JSON.stringify(newTransactions));
    console.log('✅ New transactions stored in localStorage');
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
