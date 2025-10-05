
import React, { useState, useMemo } from 'react';
import type { AppView } from '../App';
import { Page } from '../App';
import { useReminders } from '../hooks/useReminders';
import ReminderList from '../components/ReminderList';
import Layout from '../components/Layout';
import { Plus, Search } from 'lucide-react';
import { ReminderStatus } from '../types';

interface ListPageProps {
  setView: (view: AppView) => void;
  onViewImage: (url: string) => void;
}

const ListPage: React.FC<ListPageProps> = ({ setView, onViewImage }) => {
  const { reminders, toggleReminderStatus, deleteReminder } = useReminders();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReminders = useMemo(() => {
    if (!reminders) return [];
    
    // First, filter for only pending reminders
    const pendingReminders = reminders.filter(r => r.status === ReminderStatus.Pending);

    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) {
        return pendingReminders;
    }
    
    return pendingReminders.filter(r =>
      r.title.toLowerCase().includes(lowercasedQuery) ||
      (r.description && r.description.toLowerCase().includes(lowercasedQuery))
    );
  }, [reminders, searchQuery]);

  return (
    <Layout title="Meus Lembretes" setView={setView}>
      <div className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Consultar lembretes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
            aria-label="Consultar lembretes"
          />
        </div>
        
        {filteredReminders && filteredReminders.length > 0 ? (
          <ReminderList 
            reminders={filteredReminders}
            onToggleStatus={toggleReminderStatus}
            onDelete={deleteReminder}
            onEdit={(id) => setView({ page: Page.Form, reminderId: id.toString() })}
            onViewImage={onViewImage}
          />
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-500">{searchQuery ? 'Nenhum resultado encontrado.' : 'Nenhum lembrete pendente.'}</p>
            {!searchQuery && <p className="text-slate-400">Crie um para começar ou veja os concluídos no arquivo!</p>}
          </div>
        )}
      </div>
      <button
        onClick={() => setView({ page: Page.Form })}
        className="fixed bottom-6 right-6 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900"
        aria-label="Criar novo lembrete"
      >
        <Plus size={24} />
      </button>
    </Layout>
  );
};

export default ListPage;
