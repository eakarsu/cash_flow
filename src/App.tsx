import React from 'react';
import { TransactionProvider } from './context/TransactionContext';
import AppRouter from './router/AppRouter';

function App() {
  return (
    <TransactionProvider>
      <AppRouter />
    </TransactionProvider>
  );
}

export default App;
