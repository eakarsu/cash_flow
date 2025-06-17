import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  onImport?: () => void;
  onExport?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onImport, onExport }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onImport={onImport} onExport={onExport} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
