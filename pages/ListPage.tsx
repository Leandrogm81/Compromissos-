import React, { useState, useMemo } from 'react';
import type { Reminder } from '../types';
import { useReminders } from '../hooks/useReminders';
import ReminderList from '../components/ReminderList';
import CalendarView from '../components/CalendarView';
import Layout from '../components/Layout';
import { Search, List, Calendar } from 'lucide-react';
import { ReminderStatus } from '../types';
import { isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigation, Page } from '../contexts/NavigationContext';
import SpeedDialFab from '../components/SpeedDialFab';

interface ListPageProps {
  onViewImage: (url: string) => void;
  setIsAiCreatorOpen: (isOpen: boolean) => void;
  setIsImageToTextModalOpen: (isOpen: boolean) => void;
}

type ActiveView = 'list' | 'calendar';

const ListPage: React.FC<ListPageProps> = ({ onViewImage, setIsAiCreatorOpen, setIsImageToTextModalOpen }) => {
  const { setView } = useNavigation();
  const { reminders, toggleReminderStatus, deleteReminder, updateSubtaskStatus } = useReminders();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('list');

  const pendingReminders = useMemo(() => {
      if (!reminders) return [];
      return reminders.filter(r => r.status === ReminderStatus.Pending);
  }, [reminders]);

  const filteredReminders = useMemo(() => {
    if (activeView === 'calendar') return pendingReminders;

    const lowercasedQuery = searchQuery.toLowerCase().trim();
    if (!lowercasedQuery) {
        return pendingReminders;
    }
    
    return pendingReminders.filter(r =>
      r.title.toLowerCase().includes(lowercasedQuery) ||
      (r.description && r.description.toLowerCase().includes(lowercasedQuery))
    );
  }, [pendingReminders, searchQuery, activeView]);

  const groupedReminders = useMemo(() => {
    if (!filteredReminders) return {};

    const groups: { [key: string]: Reminder[] } = {
      'Hoje': [],
      'Amanhã': [],
      'Esta Semana': [],
      'Próximos': [],
    };

    filteredReminders.forEach(reminder => {
      const date = parseISO(reminder.datetime);
      if (isToday(date)) {
        groups['Hoje'].push(reminder);
      } else if (isTomorrow(date)) {
        groups['Amanhã'].push(reminder);
      } else if (isThisWeek(date, { weekStartsOn: 1 })) { // Monday start
        groups['Esta Semana'].push(reminder);
      } else if (date > new Date()) {
        groups['Próximos'].push(reminder);
      }
    });

    // Clean up empty groups and sort them
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      } else {
        groups[key].sort((a,b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
      }
    });

    return groups;
  }, [filteredReminders]);

  const groupOrder = ['Hoje', 'Amanhã', 'Esta Semana', 'Próximos'];
  
  const handleEditReminder = (id: number) => {
    setView({ page: Page.Form, reminderId: id.toString() });
  };
  
  const handleViewReminder = (id: number) => {
    setView({ page: Page.View, reminderId: id.toString() });
  };

  const handleExportToGoogleCalendar = (reminderId: number) => {
    const reminder = reminders?.find(r => r.id === reminderId);
    if (!reminder) {
        toast.error('Lembrete não encontrado para exportação.');
        return;
    }

    const formatDate = (date: Date) => {
      // Formats to YYYYMMDDTHHMMSSZ
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = new Date(reminder.datetime);
    // Google Calendar events need an end time. Default to 1 hour duration.
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); 

    const dates = `${formatDate(startDate)}/${formatDate(endDate)}`;
    const title = encodeURIComponent(reminder.title);
    
    // Add a note about attachments not being exportable
    const description = reminder.description || '';
    const detailsText = `${description}\n\n---\nNota: Anexos (imagens, etc.) não são incluídos na exportação para o Google Calendar.`;
    const details = encodeURIComponent(detailsText);
    
    const timezone = encodeURIComponent(reminder.timezone);

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&ctz=${timezone}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success('Abrindo no Google Calendar...');
  };

  return (
    <Layout title="Meus Lembretes">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                type="text"
                placeholder="Consultar lembretes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                aria-label="Consultar lembretes"
                disabled={activeView === 'calendar'}
                />
            </div>
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                    onClick={() => setActiveView('list')}
                    className={`p-1.5 rounded-md ${activeView === 'list' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500'}`}
                    aria-label="Visualização em lista"
                >
                    <List size={20} />
                </button>
                <button
                    onClick={() => setActiveView('calendar')}
                    className={`p-1.5 rounded-md ${activeView === 'calendar' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500'}`}
                    aria-label="Visualização em calendário"
                >
                    <Calendar size={20} />
                </button>
            </div>
        </div>

        {activeView === 'list' ? (
           <>
            {filteredReminders && filteredReminders.length > 0 ? (
              <div className="space-y-6">
                {groupOrder.map(groupName => {
                  const groupReminders = groupedReminders[groupName];
                  if (!groupReminders || groupReminders.length === 0) return null;

                  return (
                    <div key={groupName}>
                      <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2 pb-1 border-b-2 border-slate-200 dark:border-slate-700">
                        {groupName}
                      </h2>
                      <ReminderList 
                        reminders={groupReminders}
                        onToggleStatus={toggleReminderStatus}
                        onDelete={deleteReminder}
                        onEdit={handleEditReminder}
                        onView={handleViewReminder}
                        onViewImage={onViewImage}
                        onUpdateSubtaskStatus={updateSubtaskStatus}
                        onExport={handleExportToGoogleCalendar}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-slate-500">{searchQuery ? 'Nenhum resultado encontrado.' : 'Nenhum lembrete pendente.'}</p>
                {!searchQuery && <p className="text-slate-400">Crie um para começar ou veja os concluídos no arquivo!</p>}
              </div>
            )}
           </>
        ) : (
          <CalendarView 
            reminders={pendingReminders}
            onEditReminder={handleEditReminder}
          />
        )}
      </div>
      <SpeedDialFab 
        onAdd={() => setView({ page: Page.Form })}
        onAiCreate={() => setIsAiCreatorOpen(true)}
        onImageCreate={() => setIsImageToTextModalOpen(true)}
      />
    </Layout>
  );
};

export default ListPage;
