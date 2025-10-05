import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Sparkles, ImagePlus } from 'lucide-react';

interface SpeedDialFabProps {
  onAdd: () => void;
  onAiCreate: () => void;
  onImageCreate: () => void;
}

const SpeedDialFab: React.FC<SpeedDialFabProps> = ({ onAdd, onAiCreate, onImageCreate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);

  const createActionHandler = (action: () => void) => () => {
    action();
    setIsOpen(false);
  };

  const actions = [
    { label: 'Criar lembrete a partir de uma imagem', icon: <ImagePlus size={20} />, action: createActionHandler(onImageCreate), bg: 'bg-blue-600 hover:bg-blue-700', ring: 'focus:ring-blue-500', padding: 'p-3' },
    { label: 'Criar lembrete com IA', icon: <Sparkles size={20} />, action: createActionHandler(onAiCreate), bg: 'bg-purple-600 hover:bg-purple-700', ring: 'focus:ring-purple-500', padding: 'p-3' },
    { label: 'Criar novo lembrete', icon: <Plus size={24} />, action: createActionHandler(onAdd), bg: 'bg-primary-600 hover:bg-primary-700', ring: 'focus:ring-primary-500', padding: 'p-4' },
  ];

  return (
    <div ref={wrapperRef} className="fixed bottom-6 right-6 flex flex-col items-end gap-4 z-30">
        {/* Action Buttons */}
        <div 
            className={`flex flex-col items-end gap-4 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        >
            {actions.map((item, index) => (
                <div key={item.label} className="flex items-center gap-3 w-max" style={{ transitionDelay: `${(actions.length - index) * 30}ms`}}>
                    <span className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm px-3 py-1.5 rounded-md shadow-md">
                        {item.label}
                    </span>
                    <button
                        onClick={item.action}
                        className={`${item.bg} ${item.ring} ${item.padding} text-white rounded-full shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
                        aria-label={item.label}
                    >
                        {item.icon}
                    </button>
                </div>
            ))}
        </div>
      
        {/* Toggle Button */}
        <button
            onClick={toggle}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-slate-900"
            aria-label={isOpen ? "Fechar menu de ações" : "Abrir menu de ações"}
            aria-expanded={isOpen}
        >
            <div className="relative w-6 h-6 flex items-center justify-center">
                 <Plus 
                    size={24} 
                    className={`transition-all duration-300 ease-in-out absolute ${isOpen ? 'opacity-0 -rotate-45 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
                />
                <X 
                    size={24} 
                    className={`transition-all duration-300 ease-in-out absolute ${isOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-45 scale-50'}`}
                />
            </div>
        </button>
    </div>
  );
};
export default SpeedDialFab;
