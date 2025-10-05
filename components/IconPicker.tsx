import React, { useRef } from 'react';
import { Briefcase, Pill, Plane, ShoppingCart, GraduationCap, Gift, Dog, Heart, Calendar, Code, Dumbbell, Music, Upload, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface IconPickerProps {
    value: string;
    onChange: (icon: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
    const customIconInputRef = useRef<HTMLInputElement>(null);

    const handleCustomIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) { // 1MB limit
            toast.error('O ícone deve ter no máximo 1MB.');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type)) {
            toast.error('Tipo de arquivo de ícone inválido.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                onChange(reader.result);
            } else {
                toast.error('Falha ao ler o arquivo de imagem.');
            }
        };
        reader.onerror = () => {
            toast.error('Ocorreu um erro ao carregar o ícone.');
        };
        reader.readAsDataURL(file);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Ícone (Opcional)
            </label>
            <div className="mt-2 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                {PREDEFINED_ICONS.map(iconName => (
                    <button
                        type="button"
                        key={iconName}
                        onClick={() => onChange(iconName)}
                        className={`p-3 rounded-lg flex items-center justify-center transition-colors ${value === iconName
                                ? 'bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500'
                                : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        aria-label={`Selecionar ícone ${iconName}`}
                    >
                        {iconComponentMap[iconName]}
                    </button>
                ))}
            </div>
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
                        {value.startsWith('data:image/') ? (
                            <img src={value} alt="Pré-visualização do ícone" className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-primary-500" />
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
                            {value.startsWith('data:image/') ? 'Alterar Ícone' : 'Carregar Ícone Customizado'}
                        </button>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PNG, JPG, etc. Máximo 1MB.</p>
                    </div>
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600"
                            aria-label="Remover ícone"
                        >
                            <XCircle size={20} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default IconPicker;
