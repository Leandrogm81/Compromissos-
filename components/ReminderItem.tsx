import React, { useState } from 'react';
import type { Reminder } from '../types';
import { ReminderStatus, Recurrence } from '../types';
import { differenceInHours } from 'date-fns';
import { Trash2, Edit, CheckCircle2, Circle, Repeat, CheckSquare, Square, Briefcase, Pill, Plane, ShoppingCart, GraduationCap, Gift, Dog, Heart, Calendar, Code, Dumbbell, Music, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { BRAZIL_TIME_ZONE } from '../constants';

interface ReminderItemProps {
  reminder: Reminder;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewImage: (url: string) => void;
  onUpdateSubtaskStatus: (subtaskId: string, done: boolean) => void;
  onExport: () => void;
}

// Define constants for proximity in hours
const HOURS_IN_A_DAY = 24;
const HOURS_IN_A_WEEK = 7 * HOURS_IN_A_DAY; // 168 hours

const recurrenceTextMap: Record<Recurrence, string> = {
    [Recurrence.None]: '',
    [Recurrence.Daily]: 'Repete diariamente',
    [Recurrence.Weekly]: 'Repete semanalmente',
    [Recurrence.Monthly]: 'Repete mensalmente',
};

/**
 * Determines the border color based on the reminder's proximity.
 * - Red: Due in the next 24 hours or overdue.
 * - Yellow: Due in the next 7 days.
 * - Green: Due in more than 7 days.
 * - Gray: Completed.
 */
const getProximityClass = (datetime: string, isDone: boolean): string => {
    if (isDone) {
      return 'border-l-4 border-gray-400 dark:border-gray-600';
    }
    const now = new Date();
    const reminderDate = new Date(datetime);
    const hoursDiff = differenceInHours(reminderDate, now);

    if (hoursDiff <= HOURS_IN_A_DAY) {
        return 'border-l-4 border-red-500'; // Próximas 24h ou atrasado
    }
    if (hoursDiff <= HOURS_IN_A_WEEK) {
        return 'border-l-4 border-yellow-500'; // Próxima semana
    }
    return 'border-l-4 border-green-500'; // Mais de 7 dias
};


const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onToggleStatus, onDelete, onEdit, onViewImage, onUpdateSubtaskStatus, onExport }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDone = reminder.status === ReminderStatus.Done;
  
  const reminderDate = new Date(reminder.datetime);
  const formattedDate = reminderDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: BRAZIL_TIME_ZONE
  }).replace(',', ' às');
  
  const proximityClass = getProximityClass(reminder.datetime, isDone);
  
  const imageAttachments = reminder.attachments?.filter(att => att.type.startsWith('image/')) || [];
  
  const renderIcon = (iconName?: string) => {
    if (!iconName) return null;

    if (iconName.startsWith('data:image/')) {
        return <img src={iconName} alt="Ícone customizado" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />;
    }
    
    const iconProps = { size: 22, className: "text-slate-500 dark:text-slate-400 flex-shrink-0" };

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

  const description = reminder.description;
  const isLongDescription = description && description.length > 120;


  return (
    <div className={`
      p-4 rounded-lg shadow-md transition-all ${proximityClass}
      ${isDone 
        ? 'bg-white/60 dark:bg-slate-800/60' 
        : 'bg-white dark:bg-slate-800'}
    `}>
      <div className="flex items-start gap-4">
        <button onClick={onToggleStatus} aria-label={isDone ? "Marcar como pendente" : "Marcar como concluído"}>
            {isDone 
                ? <CheckCircle2 className="text-green-500 mt-1" size={20} /> 
                : <Circle className="text-slate-400 dark:text-slate-500 mt-1" size={20}/>
            }
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {renderIcon(reminder.icon)}
            <p className={`font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
              {reminder.title}
            </p>
          </div>
          <p className={`text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {formattedDate}
          </p>
           {description && (
             <div className="mt-2">
               <p className={`text-sm text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words ${isLongDescription && !isExpanded ? 'line-clamp-3' : ''}`}>
                 {description}
               </p>
               {isLongDescription && (
                 <button
                   onClick={() => setIsExpanded(!isExpanded)}
                   className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline mt-1 flex items-center gap-1"
                 >
                   {isExpanded ? 'Ver menos' : 'Ver mais'}
                   {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                 </button>
               )}
             </div>
           )}
           {reminder.recurrence !== Recurrence.None && !isDone && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <Repeat size={12} />
                <span>{recurrenceTextMap[reminder.recurrence]}</span>
              </div>
           )}
           {reminder.subtasks && reminder.subtasks.length > 0 && !isDone && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    {reminder.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-3">
                            <button
                                onClick={() => onUpdateSubtaskStatus(subtask.id, !subtask.done)}
                                className="flex-shrink-0"
                                aria-label={subtask.done ? 'Marcar subtarefa como pendente' : 'Marcar subtarefa como concluída'}
                            >
                                {subtask.done ? (
                                    <CheckSquare size={18} className="text-primary-600" />
                                ) : (
                                    <Square size={18} className="text-slate-400" />
                                )}
                            </button>
                            <span className={`text-sm flex-grow ${subtask.done ? 'line-through text-slate-500' : ''}`}>
                                {subtask.text}
                            </span>
                        </div>
                    ))}
                </div>
            )}
           {imageAttachments.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {imageAttachments.map(att => (
                <img
                  key={att.id}
                  src={att.localUrl}
                  alt={att.name}
                  className="h-16 w-16 rounded-md object-cover cursor-pointer transition-transform hover:scale-105"
                  onClick={() => onViewImage(att.localUrl!)}
                />
              ))}
            </div>
           )}
        </div>
        <div className="flex gap-1">
          {!isDone && (
            <>
              <button onClick={onExport} className="p-2 text-slate-500 hover:text-blue-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Exportar para Google Calendar">
                <Share2 size={18} />
              </button>
              <button onClick={onEdit} className="p-2 text-slate-500 hover:text-primary-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Editar lembrete">
                <Edit size={18} />
              </button>
            </>
          )}
          <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Excluir lembrete">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderItem;
