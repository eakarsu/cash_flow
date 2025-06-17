import React from 'react';
import { TransactionProvider } from './context/TransactionContext.tsx';
import { AICashFlowProvider } from './context/AICashFlowContext.tsx';
import AppRouter from './router/AppRouter.tsx';

function App() {
  return (
    <TransactionProvider>
      <AICashFlowProvider>
        <AppRouter />
      </AICashFlowProvider>
    </TransactionProvider>
  );
}

export default App;
