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
  
  // Debug logging to track transaction count changes
  React.useEffect(() => {
    console.log('🔍 TransactionContext: Current transaction count:', transactions.length);
    if (transactions.length > 0) {
      console.log('🔍 First few transaction IDs:', transactions.slice(0, 5).map(t => t.id));
      console.log('🔍 Transaction date range:', {
        earliest: Math.min(...transactions.map(t => new Date(t.date).getTime())),
        latest: Math.max(...transactions.map(t => new Date(t.date).getTime()))
      });
    }
  }, [transactions.length]);

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
    console.log('🔍 Current transaction count before replace:', transactions.length);
    console.log('🗑️ Clearing localStorage completely');
    
    // Clear all localStorage
    localStorage.clear();
    
    // Set the new transactions
    setTransactions(newTransactions);
    
    // Force update localStorage immediately
    localStorage.setItem('transactions', JSON.stringify(newTransactions));
    
    // Verify the replacement
    const stored = localStorage.getItem('transactions');
    const storedCount = stored ? JSON.parse(stored).length : 0;
    console.log('✅ New transactions stored in localStorage. Count:', storedCount);
    
    // Force a re-render to ensure the context updates
    setTimeout(() => {
      console.log('🔍 Post-replace verification - Context transaction count:', transactions.length);
    }, 100);
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
