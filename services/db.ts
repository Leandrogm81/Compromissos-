import Dexie, { type Table } from 'dexie';
import type { Reminder } from '../types';

export class AppDatabase extends Dexie {
  reminders!: Table<Reminder>;

  constructor() {
    super('AgendaPWA_DB');
    
    // Define schema versions in ascending order.
    
    // Version 1: Initial schema without the recurrence field.
    // Fix: Explicitly cast 'this' to Dexie to resolve a TypeScript type error where the 'version' method was not found.
    (this as Dexie).version(1).stores({
      reminders: '++id, title, datetime, status, createdAt',
    });
    
    // Version 2: Adds the 'recurrence' field as an index.
    // Dexie will automatically handle the upgrade for existing users by
    // adding the new indexed field to the schema. Existing reminder objects
    // from version 1 won't have this property until they are updated.
    // Fix: Explicitly cast 'this' to Dexie to resolve a TypeScript type error where the 'version' method was not found.
    (this as Dexie).version(2).stores({
      reminders: '++id, title, datetime, status, createdAt, recurrence',
    });
  }
}

export const db = new AppDatabase();
