import React, { useState } from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { processVoiceTranscript } from '../services/aiService';
import { Mic, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoiceInputProps {
  onResult: (transcript: string) => void;
}

type VoiceStatus = 'idle' | 'listening' | 'processing';

const VoiceInput: React.FC<VoiceInputProps> = ({ onResult }) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');

  const handleSpeechResult = async (transcript: string) => {
    if (!transcript) {
        setStatus('idle');
        return;
    }

    setStatus('processing');
    try {
        const processedText = await processVoiceTranscript(transcript);
        onResult(processedText);
        toast.success('Texto processado pela IA.');
    } catch (e) {
        toast.error('Falha ao processar o áudio. Usando texto original.');
        onResult(transcript); // Fallback to raw transcript on error
    } finally {
        setStatus('idle');
    }
  };
  
  const { isListening, startListening, stopListening, isSupported, error } = useSpeechToText({ 
    onResult: handleSpeechResult,
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
      setStatus('listening');
      startListening();
    }
  };

  const renderIcon = () => {
    switch(status) {
        case 'listening':
            return <Mic size={18} />;
        case 'processing':
            return <Loader2 size={18} className="animate-spin" />;
        case 'idle':
        default:
            return <Mic size={18} />;
    }
  }

  const buttonClasses = () => {
    switch(status) {
        case 'listening':
             return 'bg-red-500 text-white animate-pulse';
        case 'processing':
            return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-not-allowed';
        case 'idle':
        default:
            return 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600';
    }
  }
  
  const getAriaLabel = () => {
    switch(status) {
        case 'listening':
            return 'Parar gravação';
        case 'processing':
            return 'Processando áudio...';
        case 'idle':
        default:
            return 'Iniciar gravação de voz';
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggleListening}
      disabled={status === 'processing'}
      className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors ${buttonClasses()}`}
      aria-label={getAriaLabel()}
    >
      {renderIcon()}
    </button>
  );
};

export default VoiceInput;