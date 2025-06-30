import React, { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { TransactionProvider } from './context/TransactionContext';
import { AICashFlowProvider } from './context/AICashFlowContext';
import AppRouter from './router/AppRouter';

function App() {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  return (
    <HelmetProvider>
      <TransactionProvider>
        <AICashFlowProvider>
          <AppRouter />
        </AICashFlowProvider>
      </TransactionProvider>
    </HelmetProvider>
  );
}

export default App;
