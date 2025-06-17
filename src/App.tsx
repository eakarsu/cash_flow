import React from 'react';
import AppRouter from './router/AppRouter';
import { TransactionProvider } from './context/TransactionContext';

function App() {
  return (
    <TransactionProvider>
      <AppRouter />
    </TransactionProvider>
  );
}

export default App;
