import React, { useState, useMemo, useEffect } from 'react';
import type { Reminder } from './types';
import { Theme, ThemeContext } from './hooks/useTheme';
import { Toaster } from 'react-hot-toast';
import ListPage from './pages/ListPage';
import FormPage from './pages/FormPage';
import SettingsPage from './pages/SettingsPage';
import ResolvedPage from './pages/ResolvedPage';
import ViewPage from './pages/ViewPage';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './services/db';
import { scheduleNotificationsForReminder } from './services/notificationService';
import { ReminderStatus } from './types';
import ImageViewer from './components/ImageViewer';
import AiCreatorModal from './components/AiCreatorModal';
import ImageToTextModal from './components/ImageToTextModal';
import KeepImporterModal from './components/KeepImporterModal';
import { useNavigation, Page } from './contexts/NavigationContext';


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });
  
  const { view, setView } = useNavigation();
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [isAiCreatorOpen, setIsAiCreatorOpen] = useState(false);
  const [isImageToTextModalOpen, setIsImageToTextModalOpen] = useState(false);
  const [isKeepImporterOpen, setIsKeepImporterOpen] = useState(false);
  
  const pendingReminders = useLiveQuery(() =>
      db.reminders.where('status').equals(ReminderStatus.Pending).toArray()
  , []);

  useEffect(() => {
    if (pendingReminders && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        console.log('Scheduling notifications for all pending reminders...');
        pendingReminders.forEach(scheduleNotificationsForReminder);
    }
  }, [pendingReminders]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const swUrl = `${window.location.origin}/sw.js`;
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);


  const themeValue = useMemo(() => ({ theme, setTheme }), [theme]);

  const handleAiGeneratedReminder = (data: Partial<Reminder>) => {
    setIsAiCreatorOpen(false);
    setView({ page: Page.Form, initialData: data });
  };
  
  const handleImageGeneratedReminder = (data: Partial<Reminder>) => {
    setIsImageToTextModalOpen(false);
    setView({ page: Page.Form, initialData: data });
  };
  
  const handleKeepImport = (data: Partial<Reminder>) => {
    setIsKeepImporterOpen(false);
    setView({ page: Page.Form, initialData: data });
  };

  const renderPage = () => {
    switch (view.page) {
      case Page.List:
        return <ListPage onViewImage={setViewingImage} setIsAiCreatorOpen={setIsAiCreatorOpen} setIsImageToTextModalOpen={setIsImageToTextModalOpen} setIsKeepImporterOpen={setIsKeepImporterOpen} />;
      case Page.Form:
        return <FormPage reminderId={view.reminderId} initialData={view.initialData} />;
      case Page.Settings:
        return <SettingsPage />;
      case Page.Resolved:
        return <ResolvedPage onViewImage={setViewingImage} />;
      case Page.View:
        return <ViewPage reminderId={view.reminderId} onViewImage={setViewingImage} />;
      default:
        return <ListPage onViewImage={setViewingImage} setIsAiCreatorOpen={setIsAiCreatorOpen} setIsImageToTextModalOpen={setIsImageToTextModalOpen} setIsKeepImporterOpen={setIsKeepImporterOpen} />;
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
        <AiCreatorModal
          isOpen={isAiCreatorOpen}
          onClose={() => setIsAiCreatorOpen(false)}
          onComplete={handleAiGeneratedReminder}
        />
        <ImageToTextModal
          isOpen={isImageToTextModalOpen}
          onClose={() => setIsImageToTextModalOpen(false)}
          onComplete={handleImageGeneratedReminder}
        />
        <KeepImporterModal
            isOpen={isKeepImporterOpen}
            onClose={() => setIsKeepImporterOpen(false)}
            onComplete={handleKeepImport}
        />
      </div>
    </ThemeContext.Provider>
  );
};

export default App;