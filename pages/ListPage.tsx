import React, { useState, useMemo } from 'react';
// Fix: Import `Reminder` type from `../types` where it is defined, not from `../App`.
import type { AppView } from '../App';
import type { Reminder } from '../types';
import { Page } from '../App';
import { useReminders } from '../hooks/useReminders';
import ReminderList from '../components/ReminderList';
import CalendarView from '../components/CalendarView';
import Layout from '../components/Layout';
import { Plus, Search, List, Calendar, Sparkles, Loader2, ImagePlus, FileUp } from 'lucide-react';
import { ReminderStatus } from '../types';
import { isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { summarizeReminders } from '../services/aiService';
import toast from 'react-hot-toast';

interface ListPageProps {
  setView: (view: AppView) => void;
  onViewImage: (url: string) => void;
  setIsAiCreatorOpen: (isOpen: boolean) => void;
  setIsImageToTextModalOpen: (isOpen: boolean) => void;
  setIsKeepImporterOpen: (isOpen: boolean) => void;
}

type ActiveView = 'list' | 'calendar';

const ListPage: React.FC<ListPageProps> = ({ setView, onViewImage, setIsAiCreatorOpen, setIsImageToTextModalOpen, setIsKeepImporterOpen }) => {
  const { reminders, toggleReminderStatus, deleteReminder, updateSubtaskStatus } = useReminders();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('list');
  const [isSummarizing, setIsSummarizing] = useState(false);

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

  const handleSummary = async () => {
    const todayReminders = groupedReminders['Hoje'] || [];
    setIsSummarizing(true);
    try {
      const summary = await summarizeReminders(todayReminders);
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4`}
          >
            <div className="w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                ✨ Resumo do seu dia
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                {summary}
              </p>
            </div>
            <div className="flex border-l border-gray-200 dark:border-slate-700 ml-4 pl-4">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Fechar
              </button>
            </div>
          </div>
        ),
        { duration: 30000 }
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar resumo.");
    } finally {
      setIsSummarizing(false);
    }
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

  const hasTodayReminders = groupedReminders['Hoje'] && groupedReminders['Hoje'].length > 0;

  return (
    <Layout title="Meus Lembretes" setView={setView}>
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

        {process.env.API_KEY && activeView === 'list' && (
          <div className="flex justify-start">
            <button
              onClick={handleSummary}
              disabled={isSummarizing || !hasTodayReminders}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/40 rounded-md hover:bg-primary-200 dark:hover:bg-primary-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummarizing ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
              Resumo do Dia com IA
            </button>
          </div>
        )}
        
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
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-3">
        <button
          onClick={() => setIsKeepImporterOpen(true)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-3 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-slate-900"
          aria-label="Importar do Google Keep"
        >
          <FileUp size={20} />
        </button>
        {process.env.API_KEY && (
          <>
            <button
              onClick={() => setIsImageToTextModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
              aria-label="Criar lembrete a partir de uma imagem"
            >
              <ImagePlus size={20} />
            </button>
            <button
              onClick={() => setIsAiCreatorOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-slate-900"
              aria-label="Criar lembrete com IA"
            >
              <Sparkles size={20} />
            </button>
          </>
        )}
        <button
          onClick={() => setView({ page: Page.Form })}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900"
          aria-label="Criar novo lembrete"
        >
          <Plus size={24} />
        </button>
      </div>
    </Layout>
  );
};

export default ListPage;
