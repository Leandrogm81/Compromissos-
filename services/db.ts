import Dexie, { type Table } from 'dexie';
import type { Reminder } from '../types';

export class AppDatabase extends Dexie {
  reminders!: Table<Reminder>;

  constructor() {
    super('AgendaPWA_DB');
    // Fix: Cast 'this' to Dexie to resolve a TypeScript error where the inherited 'version' method is not found.
    (this as Dexie).version(1).stores({
      reminders: '++id, title, datetime, status, createdAt',
    });
  }
}

export const db = new AppDatabase();
