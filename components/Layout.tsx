
import React from 'react';
import Header from './Header';
import type { AppView } from '../App';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  setView: (view: AppView) => void;
  showBackButton?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, setView, showBackButton = false }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <Header title={title} setView={setView} showBackButton={showBackButton} />
      <main className="pb-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;
