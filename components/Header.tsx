
import React from 'react';
import { ArrowLeft, Settings, Archive } from 'lucide-react';
import type { AppView } from '../App';
import { Page } from '../App';

interface HeaderProps {
  title: string;
  setView: (view: AppView) => void;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, setView, showBackButton }) => {
  return (
    <header className="sticky top-0 z-10 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between h-16">
        <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                onClick={() => setView({ page: Page.List })}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label="Voltar"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h1>
        </div>
        
        <div className="flex items-center gap-1">
          {!showBackButton && (
             <button
                onClick={() => setView({ page: Page.Resolved })}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                aria-label="Lembretes arquivados"
              >
                <Archive size={20} />
              </button>
          )}
          <button
            onClick={() => setView({ page: Page.Settings })}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Configurações"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
