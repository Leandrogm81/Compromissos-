import React from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceInputProps {
  onResult: (transcript: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult }) => {
  const handleEnd = () => {
    toast('Gravação finalizada.', { icon: '🎤' });
  };
  
  // Fix: Correctly pass the 'handleEnd' function to the 'onEnd' property of the useSpeechToText hook.
  const { isListening, startListening, stopListening, isSupported, error } = useSpeechToText({ onResult, onEnd: handleEnd });

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

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors
        ${isListening 
          ? 'bg-red-500 text-white animate-pulse' 
          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
      aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação de voz'}
    >
      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );
};

export default VoiceInput;
