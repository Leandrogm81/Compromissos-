
import React, { useState, useMemo } from 'react';
import type { Reminder } from '../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isSameDay
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  reminders: Reminder[];
  onEditReminder: (id: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ reminders, onEditReminder }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const remindersByDay = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    reminders.forEach(reminder => {
      const dayKey = format(new Date(reminder.datetime), 'yyyy-MM-dd');
      if (!map.has(dayKey)) {
        map.set(dayKey, []);
      }
      map.get(dayKey)!.push(reminder);
    });
    return map;
  }, [reminders]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Mês anterior">
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-bold text-lg capitalize text-center w-full">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Próximo mês">
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-slate-500 dark:text-slate-400">
        {weekDays.map(day => (
          <div key={day} className="font-medium py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mt-1">
        {days.map(day => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayReminders = remindersByDay.get(dayKey) || [];

          return (
            <div
              key={day.toString()}
              className={`
                p-2 border rounded-md min-h-[120px] flex flex-col transition-colors
                ${!isSameMonth(day, currentMonth) 
                    ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600' 
                    : 'bg-white dark:bg-slate-800'}
                ${isToday(day) 
                    ? 'border-primary-500 ring-1 ring-primary-500' 
                    : 'border-slate-200 dark:border-slate-700'}
              `}
            >
              <span className={`font-medium self-center text-sm ${isToday(day) ? 'text-white bg-primary-600 rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-1 overflow-y-auto flex-grow">
                {dayReminders.map(reminder => (
                  <button
                    key={reminder.id}
                    onClick={() => onEditReminder(reminder.id!)}
                    className="w-full text-left text-xs p-1 bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 rounded cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-900 truncate"
                    title={reminder.title}
                  >
                    {reminder.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
