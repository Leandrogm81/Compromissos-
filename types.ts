
export type Subtask = {
  id: string;
  text: string;
  done: boolean;
};

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

export enum Recurrence {
  None = 'none',
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
}

export type Reminder = {
  id?: number;
  title: string;
  description?: string;
  datetime: string;     // ISO
  timezone: string;     // IANA
  reminders: number[];  // minutos antes (ex.: [5, 30])
  attachments: Attachment[];
  subtasks?: Subtask[];
  status: ReminderStatus;
  recurrence: Recurrence;
  createdAt: string;
  updatedAt: string;
};
