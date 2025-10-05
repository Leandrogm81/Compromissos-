import { useState, useEffect, useRef } from 'react';

interface SpeechToTextOptions {
  onResult: (transcript: string) => void;
  onInterimResult?: (transcript: string) => void;
  onEnd?: () => void;
}

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const isSupported = !!SpeechRecognition;

export const useSpeechToText = ({ onResult, onInterimResult, onEnd }: SpeechToTextOptions) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

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
      let interimTranscript = '';
      let finalTranscript = '';
      
      // A abordagem mais robusta é reconstruir a transcrição inteira a cada evento
      // para evitar erros de acumulação.
      for (let i = 0; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      // Armazena a transcrição final mais recente na ref para ser usada no `onend`.
      finalTranscriptRef.current = finalTranscript;

      // O callback de resultado interino exibe a transcrição completa (final + provisória)
      // para um feedback visual contínuo e preciso.
      if (onInterimResult) {
        onInterimResult(finalTranscript + interimTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      setError(`Erro no reconhecimento de voz: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
        setIsListening(false);
        // Ao finalizar, envia a transcrição final completa e consolidada.
        const result = finalTranscriptRef.current.trim();
        if (result) {
            onResult(result);
        }
        if (onEnd) onEnd();
    }

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onResult, onInterimResult, onEnd]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      // Limpa a transcrição anterior para iniciar uma nova sessão limpa.
      finalTranscriptRef.current = '';
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
