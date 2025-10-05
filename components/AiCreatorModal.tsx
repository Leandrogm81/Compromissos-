import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Reminder } from '../types';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Loader2, Sparkles, X, Send, Mic } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleGenAI, Chat } from '@google/genai';

interface AiChatModalProps {
  onClose: () => void;
  onComplete: (data: Partial<Reminder>) => void;
}

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const AiChatModal: React.FC<AiChatModalProps> = ({ onClose, onComplete }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [finalReminderData, setFinalReminderData] = useState<Partial<Reminder> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const chatInstance = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `Você é um assistente para criar lembretes. Seu objetivo é coletar o título, a data e a hora do lembrete.
          - Comece se apresentando e perguntando como pode ajudar.
          - Seja amigável e conversacional.
          - Se o usuário fornecer informações parciais, faça perguntas de acompanhamento para obter os detalhes que faltam (título, data, hora).
          - A data de referência é hoje: ${new Date().toLocaleDateString('pt-BR')}.
          - Quando tiver todas as informações necessárias (título, data e hora), confirme com o usuário e, em seguida, responda APENAS com o objeto JSON final envolto em \`\`\`json ... \`\`\`.
          - O JSON deve ter os campos: "title", "description", e "datetime" (no formato ISO 8601 UTC).
          - Não adicione o JSON até ter certeza de que coletou todos os dados.`,
        },
      });
      setChat(chatInstance);
      
      // Initial greeting from AI
      setIsTyping(true);
      chatInstance.sendMessage({ message: "Olá" }).then(response => {
        setMessages([{ role: 'model', content: response.text }]);
        setIsTyping(false);
      });

    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  const handleInterimResult = (transcript: string) => {
    setInput(transcript);
  };
  
  const handleFinalResult = (transcript: string) => {
    setInput(transcript);
    // Automatically send message after voice input is finalized
    sendMessage(transcript);
  };

  const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
      onResult: handleFinalResult,
      onInterimResult: handleInterimResult,
  });

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !chat) return;

    const text = messageText.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsTyping(true);

    try {
      const response = await chat.sendMessage({ message: text });
      const responseText = response.text;

      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsedJson = JSON.parse(jsonMatch[1]);
          setFinalReminderData({
            title: parsedJson.title,
            description: parsedJson.description,
            datetime: parsedJson.datetime,
          });
          setMessages(prev => [...prev, { role: 'model', content: "Ótimo! Preparei o lembrete para você. Você pode revisar e salvar." }]);
        } catch (e) {
            console.error("Failed to parse JSON from AI:", e);
            toast.error("A IA retornou um formato inválido. Tente novamente.");
            setMessages(prev => [...prev, { role: 'model', content: "Houve um problema ao processar os detalhes. Podemos tentar de novo?" }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', content: responseText }]);
      }
    } catch (error) {
      toast.error("Erro ao comunicar com a IA.");
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleManualSend = () => {
      sendMessage(input);
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" aria-modal="true" role="dialog">
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg m-4 flex flex-col h-[70vh] transform transition-all animate-slide-up">
        <div className="p-4 border-b dark:border-slate-700">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="text-primary-500" />
              Chat para Criar Lembrete
            </h2>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
                <div className="flex justify-start">
                    <div className="max-w-xs p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                        <div className="flex items-center gap-2">
                            <span className="typing-dot"></span>
                            <span className="typing-dot" style={{animationDelay: '0.2s'}}></span>
                            <span className="typing-dot" style={{animationDelay: '0.4s'}}></span>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
        
        {finalReminderData ? (
             <div className="p-4 border-t dark:border-slate-700 flex justify-end">
                 <button
                    onClick={() => onComplete(finalReminderData)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700"
                >
                    Criar Lembrete
                </button>
             </div>
        ) : (
            <div className="p-4 border-t dark:border-slate-700">
                <div className="flex items-center gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleManualSend();
                            }
                        }}
                        rows={1}
                        className="flex-1 resize-none p-2 rounded-md border-slate-300 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700"
                        placeholder="Digite sua mensagem..."
                        disabled={isTyping || isListening}
                    />
                     {isSupported && (
                        <button
                            onClick={handleVoiceToggle}
                            className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-600'}`}
                            aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação'}
                        >
                            <Mic size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleManualSend}
                        disabled={!input || isTyping || isListening}
                        className="p-2 rounded-full bg-primary-600 text-white disabled:bg-primary-300 disabled:cursor-not-allowed"
                        aria-label="Enviar mensagem"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>
        )}

        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Fechar">
          <X size={20} />
        </button>
      </div>
       <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s ease-out; }
        @keyframes typing-bubble {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
        }
        .typing-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: #94a3b8;
            animation: typing-bubble 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default AiChatModal;
