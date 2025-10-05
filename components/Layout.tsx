import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, showBackButton = false }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Header title={title} showBackButton={showBackButton} />
      <main className="pb-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;
