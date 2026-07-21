import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  onImport?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onImport }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onImport={onImport} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
