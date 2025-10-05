
import React, { useState, useMemo } from 'react';
import type { Reminder } from './types';
import { Theme, ThemeContext } from './hooks/useTheme';
import { Toaster } from 'react-hot-toast';
import ListPage from './pages/ListPage';
import FormPage from './pages/FormPage';
import SettingsPage from './pages/SettingsPage';
import ResolvedPage from './pages/ResolvedPage';

export enum Page {
  List,
  Form,
  Settings,
  Resolved,
}

export type AppView = 
  | { page: Page.List }
  | { page: Page.Form, reminderId?: string }
  | { page: Page.Settings }
  | { page: Page.Resolved };

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  const [view, setView] = useState<AppView>({ page: Page.List });

  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);

  const renderPage = () => {
    switch (view.page) {
      case Page.List:
        return <ListPage setView={setView} />;
      case Page.Form:
        return <FormPage setView={setView} reminderId={view.reminderId} />;
      case Page.Settings:
        return <SettingsPage setView={setView} />;
      case Page.Resolved:
        return <ResolvedPage setView={setView} />;
      default:
        return <ListPage setView={setView} />;
    }
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="min-h-screen">
        {renderPage()}
        <Toaster
          position="top-center"
          toastOptions={{
            className: 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-lg',
            duration: 4000,
          }}
        />
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
