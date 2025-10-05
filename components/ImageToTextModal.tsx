import React, { useState, useEffect, useCallback } from 'react';
import { UploadCloud, Loader2, ImagePlus, Save, Trash2, ClipboardPaste } from 'lucide-react';
import { getReminderFromImage } from '../services/aiService';
import toast from 'react-hot-toast';
import type { Reminder, Attachment } from '../types';
import { useImageAiRules } from '../hooks/useImageAiRules';
import { calculateFileHash } from '../services/fileService';
import Modal from './Modal';
import { useClipboardPaste } from '../hooks/useClipboardPaste';

interface ImageToTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Partial<Reminder>) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });


const ImageToTextModal: React.FC<ImageToTextModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');

  const { rules, addRule, deleteRule } = useImageAiRules();
  
  const resetState = useCallback(() => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setSelectedFile(null);
    setInstructions('');
    setSelectedRuleId('');
    setIsLoading(false);
    setIsDragging(false);
  }, [imagePreview]);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (selectedRuleId && rules) {
      const selectedRule = rules.find(r => r.id === parseInt(selectedRuleId, 10));
      if (selectedRule) {
        setInstructions(selectedRule.instructions);
      }
    } else if (!selectedRuleId) {
        setInstructions('');
    }
  }, [selectedRuleId, rules]);
  
  const processNewFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem.');
      return;
    }
    // Clean up previous image URL to prevent memory leaks
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };
  
  const handlePastedFiles = useCallback((files: File[]) => {
    if (files.length > 0) {
        processNewFile(files[0]);
    }
  }, [imagePreview]); // Dependency needed to correctly revoke old URL

  const { pasteFromClipboard, isReading: isPasting } = useClipboardPaste(handlePastedFiles);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      processNewFile(files[0]);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileChange(e.dataTransfer.files);
    }
  };
  
  const resetImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setSelectedFile(null);
  };

  const handleStartSaveRule = () => {
    setIsSavingRule(true);
  };

  const handleConfirmSaveRule = async () => {
    if (!newRuleName.trim()) {
      toast.error('Por favor, insira um nome para a regra.');
      return;
    }
    await addRule(newRuleName, instructions);
    setIsSavingRule(false);
    setNewRuleName('');
  };

  const handleCancelSaveRule = () => {
    setIsSavingRule(false);
    setNewRuleName('');
  };

  const handleDeleteRule = () => {
    if (selectedRuleId && rules) {
        const ruleToDelete = rules.find(r => r.id === parseInt(selectedRuleId, 10));
        if (ruleToDelete && window.confirm(`Tem certeza que deseja excluir a regra "${ruleToDelete.name}"?`)) {
            deleteRule(ruleToDelete.id!);
            setSelectedRuleId('');
        }
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) {
      toast.error('Nenhuma imagem selecionada.');
      return;
    }

    setIsLoading(true);
    try {
      const base64Data = await fileToBase64(selectedFile);
      const reminderData = await getReminderFromImage(
        {
          mimeType: selectedFile.type,
          data: base64Data,
        },
        instructions
      );
      
      const hash = await calculateFileHash(selectedFile);
      const newAttachment: Attachment = {
        id: crypto.randomUUID(),
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        hash,
        blob: selectedFile,
        localUrl: imagePreview!,
        createdAt: new Date().toISOString(),
      };
      
      onComplete({ ...reminderData, attachments: [newAttachment] });

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Falha ao processar a imagem.');
    } finally {
      setIsLoading(false);
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={handleProcessImage}
        disabled={!selectedFile || isLoading}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : null}
        {isLoading ? 'Analisando...' : 'Analisar e Criar'}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Lembrete por Imagem"
      titleIcon={<ImagePlus className="text-primary-500" />}
      footer={modalFooter}
    >
      {imagePreview ? (
        <div className="space-y-4">
          <div className="relative">
            <img src={imagePreview} alt="Pré-visualização" className="w-full h-auto max-h-64 object-contain rounded-md border dark:border-slate-700" />
            <button
              onClick={resetImage}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80"
              aria-label="Remover imagem"
            >
              <Trash2 size={18} />
            </button>
          </div>
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Regras ou contexto adicional (opcional)
            </label>
            
            {rules && rules.length > 0 && !isSavingRule && (
                <div className="flex items-center gap-2 mb-2">
                    <select
                        id="rule-select"
                        value={selectedRuleId}
                        onChange={(e) => setSelectedRuleId(e.target.value)}
                        className="flex-grow block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-700 sm:text-sm"
                    >
                        <option value="">Carregar regra salva...</option>
                        {rules.map(rule => (
                            <option key={rule.id} value={rule.id}>{rule.name}</option>
                        ))}
                    </select>
                    <button 
                        onClick={handleDeleteRule} 
                        disabled={!selectedRuleId}
                        className="p-2 text-slate-500 hover:text-red-500 disabled:text-slate-400 disabled:cursor-not-allowed rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600"
                        aria-label="Excluir regra selecionada"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            )}
            
            {isSavingRule ? (
                <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                    <p className="text-sm font-medium">Salvando regra:</p>
                    <p className="text-sm p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-600 whitespace-pre-wrap">{instructions}</p>
                    <input
                        type="text"
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        placeholder="Dê um nome para esta regra..."
                        className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={handleCancelSaveRule}
                            className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 bg-transparent rounded-md hover:bg-slate-100 dark:hover:bg-slate-600"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmSaveRule}
                            className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                        >
                            Salvar Regra
                        </button>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => {
                        setInstructions(e.target.value);
                        if (selectedRuleId) setSelectedRuleId('');
                    }}
                    rows={3}
                    className="block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm pr-10"
                    placeholder="Ex: 'Ignorar o endereço', 'O evento é na próxima semana'"
                    />
                     <button
                        onClick={handleStartSaveRule}
                        disabled={!instructions.trim()}
                        className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-primary-600 disabled:text-slate-400 disabled:cursor-not-allowed rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"
                        aria-label="Salvar instrução como uma nova regra"
                     >
                        <Save size={18} />
                     </button>
                </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
            <label
            htmlFor="image-upload"
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`flex flex-col justify-center items-center w-full h-48 px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}`}
            >
            <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 dark:text-slate-400">
                <p>Arraste e solte ou <span className="font-semibold text-primary-600 dark:text-primary-400">procure uma imagem</span></p>
                <input id="image-upload" name="image-upload" type="file" accept="image/*" className="sr-only" onChange={(e) => handleFileChange(e.target.files)} />
                </div>
                <p className="text-xs text-slate-500">PNG, JPG, GIF, etc.</p>
            </div>
            </label>
            <button
                type="button"
                onClick={pasteFromClipboard}
                disabled={isPasting}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 disabled:opacity-50"
            >
                {isPasting ? <Loader2 size={16} className="animate-spin" /> : <ClipboardPaste size={16} />}
                {isPasting ? 'Lendo...' : 'Colar Imagem da Área de Transferência'}
            </button>
        </div>
      )}
    </Modal>
  );
};

export default ImageToTextModal;
