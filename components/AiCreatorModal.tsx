import React, { useState, useEffect, useRef } from 'react';
import type { Reminder } from '../types';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Sparkles, Send, Mic, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { GoogleGenAI, Chat } from '@google/genai';
import Modal from './Modal';

interface AiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Partial<Reminder>) => void;
}

type ChatMessage = {
  role: 'user' | 'model';
  content: string;
};

const AiCreatorModal: React.FC<AiChatModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [finalReminderData, setFinalReminderData] = useState<Partial<Reminder> | null>(null);
  const [apiKeyPresent, setApiKeyPresent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // FIX: Per coding guidelines, use process.env.API_KEY to access the Gemini API key.
      const apiKey = process.env.API_KEY;
      if (apiKey) {
        setApiKeyPresent(true);
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
        
        setIsTyping(true);
        chatInstance.sendMessage({ message: "Olá" }).then(response => {
          setMessages([{ role: 'model', content: response.text }]);
          setIsTyping(false);
        }).catch(err => {
          console.error("Failed to get initial greeting from AI", err);
          toast.error("Não foi possível iniciar o chat com a IA.");
          setIsTyping(false);
        });
      } else {
        setApiKeyPresent(false);
      }
    } else {
        // Reset state when modal is closed
        setMessages([]);
        setInput('');
        setFinalReminderData(null);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  
  const handleInterimResult = (transcript: string) => {
    setInput(transcript);
  };
  
  const handleFinalResult = (transcript: string) => {
    setInput(transcript);
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

  const modalFooter = (
    finalReminderData ? (
      <div className="w-full flex justify-end">
        <button
          onClick={() => onComplete(finalReminderData)}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700"
        >
          Criar Lembrete
        </button>
      </div>
    ) : (
      <div className="w-full">
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
            className="flex-1 resize-none p-2 rounded-md border-slate-300 dark:border-slate-600 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-700 disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
            placeholder={apiKeyPresent ? "Digite sua mensagem..." : "Funcionalidade desativada."}
            disabled={isTyping || isListening || !apiKeyPresent}
          />
          {isSupported && (
            <button
              onClick={handleVoiceToggle}
              className={`p-2 rounded-full ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-600'}`}
              aria-label={isListening ? 'Parar gravação' : 'Iniciar gravação'}
              disabled={!apiKeyPresent}
            >
              <Mic size={20} />
            </button>
          )}
          <button
            onClick={handleManualSend}
            disabled={!input || isTyping || isListening || !apiKeyPresent}
            className="p-2 rounded-full bg-primary-600 text-white disabled:bg-primary-300 dark:disabled:bg-primary-800 disabled:cursor-not-allowed"
            aria-label="Enviar mensagem"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    )
  );


  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Chat para Criar Lembrete"
        titleIcon={<Sparkles className="text-primary-500" />}
        className="max-w-lg h-[70vh]"
        footer={modalFooter}
    >
        <div className="space-y-4 h-full">
            {!apiKeyPresent ? (
               <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400">
                 <AlertTriangle size={40} className="text-yellow-500 mb-4" />
                 <h3 className="font-semibold text-lg">Funcionalidade de IA Indisponível</h3>
                 <p className="text-sm mt-1">A chave da API para o serviço de IA não foi configurada. Por favor, configure a variável de ambiente para habilitar este recurso.</p>
               </div>
            ) : (
                <>
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
                </>
            )}
             <div ref={messagesEndRef} />
        </div>
        <style>{`
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
    </Modal>
  );
};

export default AiCreatorModal;