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
  resetAppState: () => void;
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
  // Load transactions from localStorage on initialization
  const [transactions, setTransactions] = React.useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem('transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          console.log('🔄 Loading transactions from localStorage on init:', parsed.length);
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading transactions from localStorage:', error);
    }
    console.log('🔄 No transactions in localStorage, starting with empty array');
    return [];
  });
  
  // Debug logging to track transaction count changes
  React.useEffect(() => {
    console.log('🔍 TransactionContext: Current transaction count:', transactions.length);
    if (transactions.length > 0) {
      console.log('🔍 First few transaction IDs:', transactions.slice(0, 5).map(t => t.id));
      
      // Check for any non-imported transactions
      const importedCount = transactions.filter(t => t.id.startsWith('imported-')).length;
      const otherCount = transactions.length - importedCount;
      
      console.log('📊 Transaction breakdown:');
      console.log('  - Imported:', importedCount);
      console.log('  - Other (should be 0):', otherCount);
      
      if (otherCount > 0) {
        console.warn('⚠️ Found non-imported transactions! This should not happen.');
        const nonImported = transactions.filter(t => !t.id.startsWith('imported-'));
        console.warn('⚠️ Non-imported transaction IDs:', nonImported.map(t => t.id));
      }
      
      console.log('🔍 Transaction date range:', {
        earliest: Math.min(...transactions.map(t => new Date(t.date).getTime())),
        latest: Math.max(...transactions.map(t => new Date(t.date).getTime()))
      });
    }
  }, [transactions.length]);

  const addTransaction = (transactionData: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const updatedTransactions = [newTransaction, ...transactions];
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };

  const updateTransaction = (id: string, transactionData: Omit<Transaction, 'id'>) => {
    const updatedTransactions = transactions.map(t => t.id === id ? { ...transactionData, id } : t);
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };

  const deleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };

  const clearAllTransactions = () => {
    console.log('🗑️ Clearing all transactions');
    localStorage.clear();
    setTransactions([]);
  };

  const resetAppState = () => {
    console.log('🔄 Resetting entire app state');
    localStorage.clear();
    setTransactions([]);
    console.log('✅ App state reset complete');
  };

  const replaceAllTransactions = (newTransactions: Transaction[]) => {
    console.log('🔄 FORCE REPLACING ALL transactions. Current:', transactions.length, 'New:', newTransactions.length);
    
    // FORCE clear everything
    localStorage.clear();
    
    // Set transactions to empty first
    setTransactions([]);
    
    // Then set ONLY the new transactions
    setTimeout(() => {
      setTransactions(newTransactions);
      localStorage.setItem('transactions', JSON.stringify(newTransactions));
      console.log('✅ FORCED replacement complete. Final count:', newTransactions.length);
    }, 0);
  };

  const value = {
    transactions,
    setTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    replaceAllTransactions,
    resetAppState,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
