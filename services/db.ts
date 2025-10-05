import Dexie, { type Table } from 'dexie';
import type { Reminder, ImageAiRule } from '../types';

// FIX: Refactored to use a direct Dexie instance instead of subclassing.
// This pattern is more direct and avoids potential 'this' context issues or
// type inheritance problems that may have caused errors with the 'version' method.
export const db = new Dexie('AgendaPWA_DB') as Dexie & {
  reminders: Table<Reminder>;
  imageAiRules: Table<ImageAiRule>;
};

// Version 1: Initial schema without the recurrence field.
db.version(1).stores({
  reminders: '++id, title, datetime, status, createdAt',
});

// Version 2: Adds the 'recurrence' field as an index.
db.version(2).stores({
  reminders: '++id, title, datetime, status, createdAt, recurrence',
});

// Version 3: No schema change for indexed fields, but acknowledges
// the addition of the non-indexed `subtasks` property on the Reminder object.
db.version(3).stores({
  reminders: '++id, title, datetime, status, createdAt, recurrence',
});

// Version 4: Adds a new table to store user-defined AI rules for image processing.
db.version(4).stores({
  reminders: '++id, title, datetime, status, createdAt, recurrence',
  imageAiRules: '++id, name',
});
