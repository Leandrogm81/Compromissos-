
import React, { useState, useEffect, useRef } from 'react';
import type { Reminder, Attachment, Subtask } from '../types';
import { Recurrence } from '../types';
import VoiceInput from './VoiceInput';
import AttachmentUploader from './AttachmentUploader';
import { useAiAssist } from '../hooks/useAiAssist';
import { Loader2, Plus, Trash2, Upload, XCircle, Briefcase, Pill, Plane, ShoppingCart, GraduationCap, Gift, Dog, Heart, Calendar, Code, Dumbbell, Music } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReminderFormProps {
  onSubmit: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  initialData?: Partial<Reminder>;
  onCancel: () => void;
}

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo';

const PREDEFINED_ICONS = ['briefcase', 'pill', 'plane', 'shopping-cart', 'graduation-cap', 'gift', 'dog', 'heart', 'calendar', 'code', 'dumbbell', 'music'] as const;
type PredefinedIcon = typeof PREDEFINED_ICONS[number];

const iconComponentMap: Record<PredefinedIcon, React.ReactNode> = {
    'briefcase': <Briefcase size={24} />,
    'pill': <Pill size={24} />,
    'plane': <Plane size={24} />,
    'shopping-cart': <ShoppingCart size={24} />,
    'graduation-cap': <GraduationCap size={24} />,
    'gift': <Gift size={24} />,
    'dog': <Dog size={24} />,
    'heart': <Heart size={24} />,
    'calendar': <Calendar size={24} />,
    'code': <Code size={24} />,
    'dumbbell': <Dumbbell size={24} />,
    'music': <Music size={24} />,
};

/**
 * Formats a Date object into a 'YYYY-MM-DDTHH:mm' string suitable for datetime-local input,
 * correctly representing the local time in São Paulo.
 * @param date - The Date object to format.
 * @returns A string in the format 'YYYY-MM-DDTHH:mm'.
 */
const toSaoPauloLocalISO = (date: Date): string => {
  const pad = (num: number) => num.toString().padStart(2, '0');
  
  // Get parts in UTC and manually adjust. A full library like date-fns-tz would be better,
  // but this avoids dependency issues and is more robust than using locale strings.
  // Note: Brazil does not currently observe DST, so UTC-3 is a stable offset.
  const spDate = new Date(date.toLocaleString('en-US', { timeZone: BRAZIL_TIME_ZONE }));

  const year = spDate.getFullYear();
  const month = pad(spDate.getMonth() + 1);
  const day = pad(spDate.getDate());
  const hours = pad(spDate.getHours());
  const minutes = pad(spDate.getMinutes());
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};


const ReminderForm: React.FC<ReminderFormProps> = ({ onSubmit, initialData, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [icon, setIcon] = useState(initialData?.icon || '');
  
  const initialDateTime = initialData?.datetime ? toSaoPauloLocalISO(new Date(initialData.datetime)) : toSaoPauloLocalISO(new Date());
  const [dateTimeLocal, setDateTimeLocal] = useState(initialDateTime);

  const [recurrence, setRecurrence] = useState<Recurrence>(initialData?.recurrence || Recurrence.None);
  const [attachments, setAttachments] = useState<Attachment[]>(initialData?.attachments || []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialData?.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  const customIconInputRef = useRef<HTMLInputElement>(null);

  const { isSuggesting, getSuggestions } = useAiAssist();
  
  const handleProcessedVoiceResult = (transcript: string) => {
    setDescription(prev => prev ? `${prev}\n${transcript}` : transcript);
  };
  
  const handleAiSuggest = async () => {
    if (!description) {
        toast.error("Por favor, insira uma descrição para a IA analisar.");
        return;
    }
    const suggestions = await getSuggestions(description, title);
    if (suggestions) {
        if (!title) {
          setTitle(suggestions.title);
        }
        setDescription(suggestions.description || '');
        if(suggestions.datetime) {
            setDateTimeLocal(toSaoPauloLocalISO(new Date(suggestions.datetime)));
        }
    }
  }
  
  const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit
        toast.error('O ícone deve ter no máximo 1MB.');
        return;
    }
    if(!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type)) {
        toast.error('Tipo de arquivo de ícone inválido.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setIcon(reader.result);
      } else {
        toast.error('Falha ao ler o arquivo de imagem.');
      }
    };
    reader.onerror = () => {
      toast.error('Ocorreu um erro ao carregar o ícone.');
    };
    reader.readAsDataURL(file);
  };

  const handleAddSubtask = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    if (e instanceof KeyboardEvent && e.key !== 'Enter') return;
    e.preventDefault();
    if (newSubtaskText.trim()) {
      const newSubtask: Subtask = {
        id: crypto.randomUUID(),
        text: newSubtaskText.trim(),
        done: false,
      };
      setSubtasks(prev => [...prev, newSubtask]);
      setNewSubtaskText('');
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!title) {
        toast.error('O título é obrigatório.');
        return;
      }
      
      // Explicitly interpret the local datetime string as being in São Paulo's timezone (UTC-3)
      // and convert it to a proper UTC Date object for storage.
      const dateTimeInBrazil = `${dateTimeLocal}:00-03:00`;
      const utcDateTime = new Date(dateTimeInBrazil);

      if (isNaN(utcDateTime.getTime())) {
        throw new Error('Data ou hora inválida.');
      }
      
      // Validation: Prevent scheduling reminders in the past.
      if (utcDateTime.getTime() < new Date().getTime() && !initialData?.id) {
          toast.error('Não é possível agendar lembretes no passado.');
          return;
      }

      onSubmit({
        title,
        description,
        icon,
        datetime: utcDateTime.toISOString(),
        timezone: BRAZIL_TIME_ZONE,
        reminders: [5, 30], // Placeholder
        attachments,
        subtasks,
        recurrence,
      });
    } catch (error) {
      console.error("Error preparing reminder data:", error);
      toast.error(error instanceof Error ? error.message : "Falha ao processar data/hora.");
    }
  };
  
  // The minimum selectable datetime for the input, to prevent past dates.
  const minDateTime = toSaoPauloLocalISO(new Date());

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
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Ícone (Opcional)
        </label>
        {/* Predefined Icons */}
        <div className="mt-2 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
            {PREDEFINED_ICONS.map(iconName => (
                <button
                    type="button"
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                        icon === iconName
                            ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                    aria-label={`Selecionar ícone ${iconName}`}
                >
                    {iconComponentMap[iconName]}
                </button>
            ))}
        </div>
        
        {/* Custom Icon Uploader */}
        <div className="mt-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <input
                    type="file"
                    ref={customIconInputRef}
                    onChange={handleCustomIconUpload}
                    accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                    className="sr-only"
                    aria-hidden="true"
                />
                <div className="flex-shrink-0">
                    {icon.startsWith('data:image/') ? (
                        <img src={icon} alt="Pré-visualização do ícone" className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-primary-500" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <Upload size={24} className="text-slate-500" />
                        </div>
                    )}
                </div>
                <div className="flex-grow">
                    <button
                        type="button"
                        onClick={() => customIconInputRef.current?.click()}
                        className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                        {icon.startsWith('data:image/') ? 'Alterar Ícone' : 'Carregar Ícone Customizado'}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG, etc. Máximo 1MB.</p>
                </div>
                {icon && (
                     <button
                        type="button"
                        onClick={() => setIcon('')}
                        className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                        aria-label="Remover ícone"
                    >
                        <XCircle size={20} />
                    </button>
                )}
            </div>
        </div>
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
          <VoiceInput onResult={handleProcessedVoiceResult} />
        </div>
        {process.env.API_KEY && (
             <button
                type="button"
                onClick={handleAiSuggest}
                disabled={isSuggesting || !description}
                className="mt-2 text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 disabled:opacity-50 flex items-center gap-1"
              >
                {isSuggesting ? <Loader2 className="animate-spin" size={16} /> : '✨ Sugerir com IA'}
              </button>
        )}
      </div>
      
      <div>
        <label htmlFor="datetime" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Data e Hora
        </label>
        <input
          type="datetime-local"
          id="datetime"
          value={dateTimeLocal}
          onChange={e => setDateTimeLocal(e.target.value)}
          min={!initialData?.id ? minDateTime : undefined}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="recurrence" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Repetir
        </label>
        <select
          id="recurrence"
          value={recurrence}
          onChange={e => setRecurrence(e.target.value as Recurrence)}
          className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
        >
          <option value={Recurrence.None}>Nunca</option>
          <option value={Recurrence.Daily}>Diariamente</option>
          <option value={Recurrence.Weekly}>Semanalmente</option>
          <option value={Recurrence.Monthly}>Mensalmente</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Subtarefas
        </label>
        <div className="mt-2 space-y-2">
            {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                    <span className="flex-grow text-sm p-2 bg-slate-100 dark:bg-slate-700 rounded-md">{subtask.text}</span>
                    <button type="button" onClick={() => handleRemoveSubtask(subtask.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
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
            <button type="button" onClick={handleAddSubtask} className="p-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                <Plus size={20} />
            </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Anexos
        </label>
        <AttachmentUploader attachments={attachments} setAttachments={setAttachments} />
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900"
        >
          {initialData?.id ? 'Salvar Alterações' : 'Criar Lembrete'}
        </button>
      </div>
    </form>
  );
};

export default ReminderForm;
