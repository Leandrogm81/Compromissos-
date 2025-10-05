
export type Attachment = {
  id: string; 
  name: string; 
  type: string; 
  size: number; 
  hash: string;
  blob: Blob;
  localUrl?: string;
  createdAt: string;
};

export enum ReminderStatus {
  Pending = 'pending',
  Done = 'done',
  Cancelled = 'cancelled',
}

export type Reminder = {
  id?: number;
  title: string;
  description?: string;
  datetime: string;     // ISO
  timezone: string;     // IANA
  reminders: number[];  // minutos antes (ex.: [5, 30])
  attachments: Attachment[];
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
};
