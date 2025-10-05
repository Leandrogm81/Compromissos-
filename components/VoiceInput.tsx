import React from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Mic } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceInputProps {
  onResult: (transcript: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult }) => {
  // Otimização: A IA foi removida daqui para garantir resposta instantânea.
  // O `onResult` do hook agora chama diretamente o `onResult` do componente pai.
  const { isListening, startListening, stopListening, isSupported, error } = useSpeechToText({
    onResult: onResult,
  });

  if (!isSupported) {
    return null;
  }
  
  if (error) {
    toast.error(error);
  }

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const buttonClasses = isListening
    ? 'bg-red-500 text-white animate-pulse'
    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600';
  
  const getAriaLabel = () => {
    return isListening ? 'Parar gravação' : 'Iniciar gravação de voz';
  }

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors ${buttonClasses}`}
      aria-label={getAriaLabel()}
    >
      <Mic size={18} />
    </button>
  );
};

export default VoiceInput;
