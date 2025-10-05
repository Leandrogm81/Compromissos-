import React from 'react';
import Layout from '../components/Layout';
import ThemeToggle from '../components/ThemeToggle';
import NotificationOptIn from '../components/NotificationOptIn';

interface SettingsPageProps {}

const SettingsPage: React.FC<SettingsPageProps> = () => {
  return (
    <Layout title="Configurações" showBackButton={true}>
      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Aparência</h2>
          <div className="flex items-center justify-between">
            <span>Tema</span>
            <ThemeToggle />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Notificações</h2>
          <NotificationOptIn />
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-3">Sobre</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Agenda PWA v1.0.0
            </p>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Um app de lembretes offline-first construído com React e tecnologias PWA.
            </p>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;