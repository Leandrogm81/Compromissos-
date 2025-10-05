
import React, { useState, useMemo, useEffect } from 'react';
import type { Reminder } from './types';
import { Theme, ThemeContext } from './hooks/useTheme';
import { Toaster } from 'react-hot-toast';
import ListPage from './pages/ListPage';
import FormPage from './pages/FormPage';
import SettingsPage from './pages/SettingsPage';
import ResolvedPage from './pages/ResolvedPage';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './services/db';
import { scheduleNotificationsForReminder } from './services/notificationService';
import { ReminderStatus } from './types';
import ImageViewer from './components/ImageViewer';

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
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  // This hook will get all pending reminders and keep the list updated.
  const pendingReminders = useLiveQuery(() =>
      db.reminders.where('status').equals(ReminderStatus.Pending).toArray()
  , []);

  // This effect runs on app load and whenever the pending reminders change.
  // It ensures that notifications are scheduled for all relevant reminders,
  // which is crucial after a page reload, as `setTimeout` state is not preserved.
  useEffect(() => {
    if (pendingReminders && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        console.log('Scheduling notifications for all pending reminders...');
        pendingReminders.forEach(scheduleNotificationsForReminder);
    }
  }, [pendingReminders]);


  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);

  const renderPage = () => {
    switch (view.page) {
      case Page.List:
        return <ListPage setView={setView} onViewImage={setViewingImage} />;
      case Page.Form:
        return <FormPage setView={setView} reminderId={view.reminderId} />;
      case Page.Settings:
        return <SettingsPage setView={setView} />;
      case Page.Resolved:
        return <ResolvedPage setView={setView} onViewImage={setViewingImage} />;
      default:
        return <ListPage setView={setView} onViewImage={setViewingImage} />;
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
        {viewingImage && <ImageViewer imageUrl={viewingImage} onClose={() => setViewingImage(null)} />}
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
