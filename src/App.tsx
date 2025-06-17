import React from 'react';
import { TransactionProvider } from './context/TransactionContext.tsx';
import AppRouter from './router/AppRouter.tsx';

function App() {
  return (
    <TransactionProvider>
      <AppRouter />
    </TransactionProvider>
  );
}

export default App;
