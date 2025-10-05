
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Reminder } from '../types';
import { ReminderStatus } from '../types';

export const useReminders = () => {
  const reminders = useLiveQuery(() => db.reminders.orderBy('datetime').toArray(), []);

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newReminder: Reminder = {
      ...reminder,
      status: ReminderStatus.Pending,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return db.reminders.add(newReminder);
  };

  const updateReminder = async (id: number, updates: Partial<Reminder>) => {
    return db.reminders.update(id, { ...updates, updatedAt: new Date().toISOString() });
  };
    
  const getReminderById = (id: number) => {
    return db.reminders.get(id);
  }

  const deleteReminder = async (id: number) => {
    return db.reminders.delete(id);
  };
  
  const toggleReminderStatus = async (id: number) => {
    const reminder = await db.reminders.get(id);
    if (reminder) {
        const newStatus = reminder.status === ReminderStatus.Pending ? ReminderStatus.Done : ReminderStatus.Pending;
        await updateReminder(id, { status: newStatus });
    }
  };

  return { reminders, addReminder, updateReminder, deleteReminder, getReminderById, toggleReminderStatus };
};
