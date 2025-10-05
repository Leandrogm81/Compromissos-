

import type { Reminder } from '../types';
import { ReminderStatus } from '../types';

// In-memory store for timeout IDs. This is a limitation of a client-side only approach,
// as these will be cleared on page refresh. The app's main logic will re-schedule them.
const scheduledTimeouts = new Map<number, any[]>();

/**
 * Shows a notification using the service worker registration.
 * This is preferred over `new Notification()` to ensure consistent
 * behavior and appearance (e.g., using icons from the manifest).
 */
function showNotification(title: string, options: NotificationOptions) {
  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, options);
    });
  }
}

/**
 * Requests permission from the user to show notifications.
 * @returns The permission state: 'granted', 'denied', or 'default'.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return 'denied';
  }
  return Notification.requestPermission();
}

/**
 * Schedules all notifications for a given reminder.
 * It will schedule notifications for the minutes defined in `reminder.reminders` array.
 */
export function scheduleNotificationsForReminder(reminder: Reminder) {
  if (!reminder.id || reminder.status !== ReminderStatus.Pending) {
    return;
  }

  // A user must grant permission for notifications, otherwise scheduling is skipped.
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return;
  }

  cancelNotificationsForReminder(reminder.id); // Clear any previously scheduled notifications for this reminder

  const now = new Date().getTime();
  const reminderTime = new Date(reminder.datetime).getTime();
  const newTimeoutIds: any[] = [];
  const commonOptions: NotificationOptions = {
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: { url: '/' }, // URL to open when the user clicks the notification.
  };

  // Schedule pre-reminders based on the 'reminders' array (e.g., [5, 30] minutes before)
  reminder.reminders.forEach(minutesBefore => {
    const preReminderTime = reminderTime - minutesBefore * 60 * 1000;
    const delay = preReminderTime - now;

    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        showNotification(`Lembrete em ${minutesBefore} min: ${reminder.title}`, {
          body: reminder.description || 'Prepare-se para o seu evento.',
          tag: `reminder-${reminder.id}-${minutesBefore}`, // Tag to prevent duplicate notifications
          ...commonOptions,
        });
      }, delay);
      newTimeoutIds.push(timeoutId);
    }
  });

  if (newTimeoutIds.length > 0) {
    scheduledTimeouts.set(reminder.id, newTimeoutIds);
  }
}

/**
 * Cancels all scheduled notifications for a specific reminder ID.
 */
export function cancelNotificationsForReminder(reminderId: number) {
  if (scheduledTimeouts.has(reminderId)) {
    scheduledTimeouts.get(reminderId)!.forEach(clearTimeout);
    scheduledTimeouts.delete(reminderId);
  }
}
