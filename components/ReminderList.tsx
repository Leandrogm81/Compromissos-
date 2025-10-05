import React from 'react';
import type { Reminder } from '../types';
import ReminderItem from './ReminderItem';

interface ReminderListProps {
  reminders: Reminder[];
  onToggleStatus: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number) => void;
  onViewImage: (url: string) => void;
  onUpdateSubtaskStatus: (reminderId: number, subtaskId: string, done: boolean) => void;
  onExport: (id: number) => void;
}

const ReminderList: React.FC<ReminderListProps> = ({ reminders, onToggleStatus, onDelete, onEdit, onViewImage, onUpdateSubtaskStatus, onExport }) => {
  return (
    <div className="space-y-3">
      {reminders.map(reminder => (
        reminder.id ? 
        <ReminderItem
          key={reminder.id}
          reminder={reminder}
          onToggleStatus={() => onToggleStatus(reminder.id!)}
          onDelete={() => onDelete(reminder.id!)}
          onEdit={() => onEdit(reminder.id!)}
          onViewImage={onViewImage}
          onUpdateSubtaskStatus={(subtaskId, done) => onUpdateSubtaskStatus(reminder.id!, subtaskId, done)}
          onExport={() => onExport(reminder.id!)}
        />
        : null
      ))}
    </div>
  );
};

export default ReminderList;