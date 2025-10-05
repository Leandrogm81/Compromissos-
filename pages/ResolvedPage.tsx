
import React, { useMemo } from 'react';
import type { AppView } from '../App';
import { Page } from '../App';
import { useReminders } from '../hooks/useReminders';
import ReminderList from '../components/ReminderList';
import Layout from '../components/Layout';
import { ReminderStatus } from '../types';
import { Archive } from 'lucide-react';

interface ResolvedPageProps {
  setView: (view: AppView) => void;
}

const ResolvedPage: React.FC<ResolvedPageProps> = ({ setView }) => {
  const { reminders, toggleReminderStatus, deleteReminder } = useReminders();

  const resolvedReminders = useMemo(() => {
    if (!reminders) return [];
    return reminders.filter(r => r.status === ReminderStatus.Done || r.status === ReminderStatus.Cancelled)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [reminders]);

  return (
    <Layout title="Arquivados" setView={setView} showBackButton={true}>
      <div className="p-4 space-y-4">
        {resolvedReminders && resolvedReminders.length > 0 ? (
          <ReminderList
            reminders={resolvedReminders}
            onToggleStatus={toggleReminderStatus}
            onDelete={deleteReminder}
            onEdit={(id) => setView({ page: Page.Form, reminderId: id.toString() })} // Editing is disabled in ReminderItem, but prop is needed
          />
        ) : (
          <div className="text-center py-16">
            <Archive size={48} className="mx-auto text-slate-400" />
            <p className="mt-4 text-slate-500">Nenhum lembrete arquivado.</p>
            <p className="text-slate-400 text-sm">Lembretes concluídos aparecerão aqui.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ResolvedPage;
