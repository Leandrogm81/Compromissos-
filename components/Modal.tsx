import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  titleIcon?: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, titleIcon, className = 'max-w-lg' }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div
        className={`relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full m-4 flex flex-col h-auto max-h-[85vh] transform transition-all animate-slide-up ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 border-b dark:border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            {titleIcon}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        <main className="p-6 flex-1 overflow-y-auto">
          {children}
        </main>

        {footer && (
          <footer className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
            {footer}
          </footer>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Modal;
