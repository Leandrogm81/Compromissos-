import Dexie, { type Table } from 'dexie';
import type { Reminder, ImageAiRule } from '../types';

// FIX: The `version()` method was not found on the extended Dexie class type when called within the constructor.
// Moving the schema definition outside of the constructor and applying it to the created 'db' instance
// resolves the TypeScript error by ensuring the method is called on a fully constructed instance.
export class AppDatabase extends Dexie {
  reminders!: Table<Reminder>;
  imageAiRules!: Table<ImageAiRule>;

  constructor() {
    super('AgendaPWA_DB');
  }
}

export const db = new AppDatabase();

// Define schema versions on the database instance.
// This approach ensures that `db` is a fully typed Dexie instance when `version()` is called.

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
