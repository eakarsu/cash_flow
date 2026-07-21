import React, { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { TransactionProvider } from './context/TransactionContext';
import { AICashFlowProvider } from './context/AICashFlowContext';
import AppRouter from './router/AppRouter';
import { AuthProvider } from './context/AuthContext';

function App() {
  useEffect(() => {
    // Register service worker for PWA
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
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
      <AuthProvider>
        <TransactionProvider>
          <AICashFlowProvider>
            <AppRouter />
          </AICashFlowProvider>
        </TransactionProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
