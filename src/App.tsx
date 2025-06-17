import React from 'react';

// Debug logging for module resolution
console.log('App.tsx: Starting imports...');

try {
  console.log('App.tsx: Attempting to import TransactionProvider...');
  const { TransactionProvider } = require('./context/TransactionContext');
  console.log('App.tsx: TransactionProvider imported successfully');
  
  console.log('App.tsx: Attempting to import AppRouter...');
  const AppRouter = require('./router/AppRouter').default;
  console.log('App.tsx: AppRouter imported successfully');

  function App() {
    console.log('App.tsx: App component rendering...');
    return (
      <TransactionProvider>
        <AppRouter />
      </TransactionProvider>
    );
  }

  export default App;
} catch (error) {
  console.error('App.tsx: Import error:', error);
  
  // Fallback component
  function App() {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Module Import Error</h1>
        <p>Failed to load required modules. Check console for details.</p>
        <pre>{error?.toString()}</pre>
      </div>
    );
  }

  export default App;
}
