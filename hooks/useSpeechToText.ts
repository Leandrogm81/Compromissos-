import { useState, useEffect, useRef } from 'react';

interface SpeechToTextOptions {
  onResult: (transcript: string) => void;
  onEnd?: () => void;
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSupported = !!SpeechRecognition;

export const useSpeechToText = ({ onResult, onEnd }: SpeechToTextOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef('');

  useEffect(() => {
    if (!isSupported) {
      setError('A API de reconhecimento de voz não é suportada neste navegador.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let finalTranscriptChunk = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptChunk += event.results[i][0].transcript;
        }
      }
      if (finalTranscriptChunk) {
        fullTranscriptRef.current += finalTranscriptChunk.trim() + ' ';
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Erro no reconhecimento de voz: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
        setIsListening(false);
        if (fullTranscriptRef.current) {
            onResult(fullTranscriptRef.current.trim());
        }
        if (onEnd) onEnd();
    }

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onResult, onEnd]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      fullTranscriptRef.current = '';
      setError(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { isListening, error, startListening, stopListening, isSupported };
};