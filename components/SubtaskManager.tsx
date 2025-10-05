import React, { useState } from 'react';
import type { Subtask } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface SubtaskManagerProps {
    value: Subtask[];
    onChange: (subtasks: Subtask[]) => void;
}

const SubtaskManager: React.FC<SubtaskManagerProps> = ({ value, onChange }) => {
    const [newSubtaskText, setNewSubtaskText] = useState('');

    const handleAddSubtask = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
        if (e instanceof KeyboardEvent && e.key !== 'Enter') return;
        e.preventDefault();
        if (newSubtaskText.trim()) {
            const newSubtask: Subtask = {
                id: crypto.randomUUID(),
                text: newSubtaskText.trim(),
                done: false,
            };
            onChange([...value, newSubtask]);
            setNewSubtaskText('');
        }
    };

    const handleRemoveSubtask = (id: string) => {
        onChange(value.filter(st => st.id !== id));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Subtarefas
            </label>
            <div className="mt-2 space-y-2">
                {value.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                        <span className="flex-grow text-sm p-2 bg-slate-100 dark:bg-slate-700 rounded-md break-all">{subtask.text}</span>
                        <button type="button" onClick={() => handleRemoveSubtask(subtask.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 flex-shrink-0">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
                <input
                    type="text"
                    value={newSubtaskText}
                    onChange={e => setNewSubtaskText(e.target.value)}
                    onKeyDown={handleAddSubtask}
                    placeholder="Adicionar nova subtarefa..."
                    className="flex-grow block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
                />
                <button type="button" onClick={handleAddSubtask} className="p-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex-shrink-0">
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );
};

export default SubtaskManager;
