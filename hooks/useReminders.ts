
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Reminder } from '../types';
import { ReminderStatus, Recurrence } from '../types';
import { scheduleNotificationsForReminder, cancelNotificationsForReminder } from '../services/notificationService';
import { addDays, addWeeks, addMonths } from 'date-fns';


export const useReminders = () => {
  const reminders = useLiveQuery(() => db.reminders.orderBy('datetime').toArray(), []);

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newReminder: Reminder = {
      ...reminder,
      status: ReminderStatus.Pending,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const id = await db.reminders.add(newReminder);
    const reminderWithId = { ...newReminder, id: Number(id) };
    scheduleNotificationsForReminder(reminderWithId); // Schedule notifications
    return id;
  };

  const updateReminder = async (id: number, updates: Partial<Reminder>) => {
    await db.reminders.update(id, { ...updates, updatedAt: new Date().toISOString() });
    const updatedReminder = await db.reminders.get(id);
    if (updatedReminder) {
      if (updatedReminder.status === ReminderStatus.Pending) {
        scheduleNotificationsForReminder(updatedReminder); // Re-schedule notifications
      } else {
        cancelNotificationsForReminder(id); // Cancel if it's no longer pending
      }
    }
    return;
  };
    
  const getReminderById = (id: number) => {
    return db.reminders.get(id);
  }

  const deleteReminder = async (id: number) => {
    cancelNotificationsForReminder(id); // Cancel notifications
    return db.reminders.delete(id);
  };

  const updateSubtaskStatus = async (reminderId: number, subtaskId: string, done: boolean) => {
    const reminder = await db.reminders.get(reminderId);
    if (!reminder || !reminder.subtasks) return;

    const updatedSubtasks = reminder.subtasks.map(subtask => 
      subtask.id === subtaskId ? { ...subtask, done } : subtask
    );

    await updateReminder(reminderId, { subtasks: updatedSubtasks });
  };
  
  const toggleReminderStatus = async (id: number) => {
    const reminder = await db.reminders.get(id);
    if (!reminder) return;

    // If it's a recurring reminder being marked as 'done'
    if (reminder.recurrence !== Recurrence.None && reminder.status === ReminderStatus.Pending) {
      // 1. Mark the current instance as done and prevent it from recurring again
      await db.reminders.update(id, {
        status: ReminderStatus.Done,
        recurrence: Recurrence.None,
        updatedAt: new Date().toISOString(),
      });
      cancelNotificationsForReminder(id);

      // 2. Calculate the next occurrence date
      const currentDatetime = new Date(reminder.datetime);
      let nextDatetime: Date;

      switch (reminder.recurrence) {
        case Recurrence.Daily:
          nextDatetime = addDays(currentDatetime, 1);
          break;
        case Recurrence.Weekly:
          nextDatetime = addWeeks(currentDatetime, 1);
          break;
        case Recurrence.Monthly:
          nextDatetime = addMonths(currentDatetime, 1);
          break;
        default:
          return; // Should not happen for 'none'
      }
      
      // 3. Create a new reminder for the next occurrence
      // Omit 'id' to let Dexie auto-generate a new primary key.
      const { id: _id, ...rest } = reminder;
      const newInstance: Omit<Reminder, 'id'> = {
          ...rest,
          datetime: nextDatetime.toISOString(),
          status: ReminderStatus.Pending,
          // Retain the original recurrence rule
          recurrence: reminder.recurrence,
          // Reset subtasks for the new recurring instance
          subtasks: reminder.subtasks?.map(st => ({ ...st, done: false })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
      };

      await addReminder(newInstance);

    } else {
      // Standard behavior: toggle between pending and done
      const newStatus = reminder.status === ReminderStatus.Pending ? ReminderStatus.Done : ReminderStatus.Pending;
      await updateReminder(id, { status: newStatus });
    }
  };


  return { reminders, addReminder, updateReminder, deleteReminder, getReminderById, toggleReminderStatus, updateSubtaskStatus };
};
