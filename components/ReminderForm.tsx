import React, { useState, useEffect } from 'react';
import type { Reminder, Attachment } from '../types';
import VoiceInput from './VoiceInput';
import AttachmentUploader from './AttachmentUploader';
import { useAiAssist } from '../hooks/useAiAssist';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReminderFormProps {
  onSubmit: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  initialData?: Reminder;
  onCancel: () => void;
}

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

const getSaoPauloDateParts = (isoString?: string) => {
    const date = isoString ? new Date(isoString) : new Date();
    
    // O locale 'sv-SE' (Sueco) formata a data como YYYY-MM-DD
    const datePart = new Intl.DateTimeFormat('sv-SE', {
        timeZone: BRAZIL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
    
    // O locale 'en-GB' (Reino Unido) formata a hora como HH:mm (24h)
    const timePart = new Intl.DateTimeFormat('en-GB', {
        timeZone: BRAZIL_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);

    return { date: datePart, time: timePart };
};

const ReminderForm: React.FC<ReminderFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  
  const { date: initialDate, time: initialTime } = getSaoPauloDateParts(initialData?.datetime);

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);

  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);

  const { isSuggesting, getSuggestions } = useAiAssist();
  
  const handleVoiceResult = (transcript: string) => {
    setDescription(prev => prev ? `${prev}\n${transcript}` : transcript);
  };
  
  const handleAiSuggest = async () => {
    if (!description) {
        toast.error("Por favor, insira uma descrição para a IA analisar.");
        return;
    }
    const suggestions = await getSuggestions(description, title);
    if (suggestions) {
        // If the title was empty, update it from the suggestion.
        // Otherwise, keep the user's existing title.
        if (!title) {
          setTitle(suggestions.title);
        }
        setDescription(suggestions.description || '');
        if(suggestions.datetime) {
            const { date: suggestedDate, time: suggestedTime } = getSaoPauloDateParts(suggestions.datetime);
            setDate(suggestedDate);
            setTime(suggestedTime);
        }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!title) {
        toast.error('O título é obrigatório.');
        return;
      }
      
      // Workaround for a broken zonedTimeToUtc function from the CDN module.
      // Manually construct an ISO string with Brazil's timezone offset (UTC-3)
      // and parse it to get the correct UTC date object.
      const dateTimeInBrazil = `${date}T${time}:00-03:00`;
      const utcDateTime = new Date(dateTimeInBrazil);

      if (isNaN(utcDateTime.getTime())) {
        throw new Error('Data ou hora inválida resultou em uma data inválida.');
      }

      onSubmit({
        title,
        description,
        datetime: utcDateTime.toISOString(),
        timezone: BRAZIL_TIME_ZONE,
        reminders: [5, 30], // Placeholder
        attachments,
      });
    } catch (error) {
      console.error("Error preparing reminder data:", error);
      toast.error("Falha ao processar data/hora. Verifique os valores.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Título
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
          required
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Descrição
        </label>
        <div className="mt-1 relative">
          <textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
            className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
          />
          <VoiceInput onResult={handleVoiceResult} />
        </div>
        {process.env.API_KEY && (
             <button
                type="button"
                onClick={handleAiSuggest}
                disabled={isSuggesting || !description}
                className="mt-2 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 disabled:opacity-50 flex items-center gap-2"
                >
                {isSuggesting && <Loader2 className="animate-spin" size={16}/>}
                Sugerir com IA
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Data
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Hora
          </label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Anexos
        </label>
        <AttachmentUploader attachments={attachments} setAttachments={setAttachments} />
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900"
        >
          Salvar
        </button>
      </div>
    </form>
  );
};

export default ReminderForm;