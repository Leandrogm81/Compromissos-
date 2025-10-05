
import React from 'react';
import type { Reminder } from '../types';
import { ReminderStatus, Recurrence } from '../types';
import { differenceInHours } from 'date-fns';
import { Trash2, Edit, CheckCircle2, Circle, Repeat } from 'lucide-react';

interface ReminderItemProps {
  reminder: Reminder;
  onToggleStatus: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onViewImage: (url: string) => void;
}

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

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


const ReminderItem: React.FC<ReminderItemProps> = ({ reminder, onToggleStatus, onDelete, onEdit, onViewImage }) => {
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
          <p className={`font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
            {reminder.title}
          </p>
          <p className={`text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {formattedDate}
          </p>
           {reminder.description && (
             <p className="text-sm mt-2 text-slate-500 dark:text-slate-400 whitespace-pre-wrap break-words">
               {reminder.description}
             </p>
           )}
           {reminder.recurrence !== Recurrence.None && !isDone && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <Repeat size={12} />
                <span>{recurrenceTextMap[reminder.recurrence]}</span>
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
            <button onClick={onEdit} className="p-2 text-slate-500 hover:text-primary-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Editar lembrete">
              <Edit size={18} />
            </button>
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
