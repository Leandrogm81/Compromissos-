import React, { useEffect, useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Reminder } from '../types';
import { useNavigation, Page } from '../contexts/NavigationContext';
import Layout from '../components/Layout';
import { Loader2, Edit, CheckSquare, Square, Repeat, Paperclip, Briefcase, Pill, Plane, ShoppingCart, GraduationCap, Gift, Dog, Heart, Calendar, Code, Dumbbell, Music } from 'lucide-react';
import { BRAZIL_TIME_ZONE } from '../constants';
import { Recurrence } from '../types';

interface ViewPageProps {
  reminderId: string;
  onViewImage: (url: string) => void;
}

const recurrenceTextMap: Record<Recurrence, string> = {
    [Recurrence.None]: '',
    [Recurrence.Daily]: 'Repete diariamente',
    [Recurrence.Weekly]: 'Repete semanalmente',
    [Recurrence.Monthly]: 'Repete mensalmente',
};

const ViewPage: React.FC<ViewPageProps> = ({ reminderId, onViewImage }) => {
  const { setView } = useNavigation();
  const numericId = parseInt(reminderId, 10);

  const reminder = useLiveQuery(() => db.reminders.get(numericId), [numericId]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const imageAttachments = useMemo(() => reminder?.attachments?.filter(att => att.type.startsWith('image/')) || [], [reminder?.attachments]);

  useEffect(() => {
    const newImageUrls: Record<string, string> = {};
    if (imageAttachments.length > 0) {
      imageAttachments.forEach(att => {
        if (att.blob) {
          const url = URL.createObjectURL(att.blob);
          newImageUrls[att.id] = url;
        }
      });
      setImageUrls(newImageUrls);
    }

    return () => {
      Object.values(newImageUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageAttachments]);

  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;
    if (iconName.startsWith('data:image/')) {
        return <img src={iconName} alt="Ícone customizado" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
    }
    const iconProps = { size: 28, className: "text-slate-500 dark:text-slate-400 flex-shrink-0" };
    const iconMap: Record<string, React.ReactNode> = {
        'briefcase': <Briefcase {...iconProps} />,
        'pill': <Pill {...iconProps} />,
        'plane': <Plane {...iconProps} />,
        'shopping-cart': <ShoppingCart {...iconProps} />,
        'graduation-cap': <GraduationCap {...iconProps} />,
        'gift': <Gift {...iconProps} />,
        'dog': <Dog {...iconProps} />,
        'heart': <Heart {...iconProps} />,
        'calendar': <Calendar {...iconProps} />,
        'code': <Code {...iconProps} />,
        'dumbbell': <Dumbbell {...iconProps} />,
        'music': <Music {...iconProps} />,
    };
    return iconMap[iconName] || null;
  };

  if (!reminder) {
    return (
      <Layout title="Carregando..." showBackButton>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin" size={32} />
        </div>
      </Layout>
    );
  }

  const formattedDate = new Date(reminder.datetime).toLocaleString('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: BRAZIL_TIME_ZONE,
  });

  return (
    <Layout title="Detalhes do Lembrete" showBackButton>
      <div className="p-4 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md">
            <header className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                {renderIcon(reminder.icon)}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{reminder.title}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{formattedDate}</p>
                </div>
            </header>
            
            <div className="py-4 space-y-4">
                {reminder.recurrence !== Recurrence.None && (
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Repeat size={16} />
                        <span className="text-sm">{recurrenceTextMap[reminder.recurrence]}</span>
                    </div>
                )}

                {reminder.description && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Descrição</h2>
                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
                            {reminder.description}
                        </p>
                    </div>
                )}

                {reminder.subtasks && reminder.subtasks.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2">Subtarefas</h2>
                        <ul className="space-y-2">
                            {reminder.subtasks.map(subtask => (
                                <li key={subtask.id} className="flex items-center gap-3">
                                    {subtask.done ? <CheckSquare size={18} className="text-primary-600" /> : <Square size={18} className="text-slate-400" />}
                                    <span className={`flex-grow ${subtask.done ? 'line-through text-slate-500' : ''}`}>
                                        {subtask.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {reminder.attachments && reminder.attachments.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Paperclip size={18} /> Anexos</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {reminder.attachments.map(att => {
                                const imageUrl = imageUrls[att.id];
                                if (att.type.startsWith('image/') && imageUrl) {
                                    return (
                                        <div key={att.id} className="relative group cursor-pointer" onClick={() => onViewImage(imageUrl)}>
                                            <img src={imageUrl} alt={att.name} className="w-full h-24 object-cover rounded-md border border-slate-200 dark:border-slate-700 transition-transform group-hover:scale-105" />
                                        </div>
                                    )
                                }
                                // Render other file types if needed in the future
                                return null;
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setView({ page: Page.Form, reminderId: reminder.id?.toString() })}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900"
          aria-label="Editar lembrete"
        >
          <Edit size={24} />
        </button>
      </div>
    </Layout>
  );
};

export default ViewPage;
