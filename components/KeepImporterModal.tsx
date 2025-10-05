import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Clipboard, Image as ImageIcon, Trash2, ClipboardPaste } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Reminder, Attachment } from '../types';
import { calculateFileHash } from '../services/fileService';
import Modal from './Modal';

interface KeepImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Partial<Reminder>) => void;
}

const KeepImporterModal: React.FC<KeepImporterModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Cleanup object URLs when attachments change or component unmounts
    return () => {
      attachments.forEach(att => {
        if (att.localUrl) {
          URL.revokeObjectURL(att.localUrl);
        }
      });
    };
  }, [attachments]);
  
  useEffect(() => {
    if (!isOpen) {
        // Reset state when modal is closed
        setTitle('');
        setDescription('');
        setAttachments([]);
    }
  }, [isOpen]);

  const processFiles = useCallback(async (files: File[] | Blob[]) => {
    const newAttachments: Attachment[] = [];
    const filesArray = Array.from(files);

    for (const item of filesArray) {
      let file: File;
      if (item instanceof File) {
        file = item;
      } else if (item instanceof Blob && item.type.startsWith('image/')) {
        const extension = item.type.split('/')[1] || 'png';
        file = new File([item], `pasted_image.${extension}`, { type: item.type });
      } else {
        continue;
      }

      try {
        const hash = await calculateFileHash(file);
        const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          hash,
          blob: file,
          localUrl: URL.createObjectURL(file),
          createdAt: new Date().toISOString(),
        };
        newAttachments.push(newAttachment);
      } catch (err) {
        console.error("Error processing file:", err);
        toast.error("Falha ao processar a imagem.");
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      toast.success(`${newAttachments.length} imagem(ns) adicionada(s)!`);
    }
  }, []);

  const readImagesFromClipboard = useCallback(async (): Promise<File[] | null> => {
    if (!navigator.clipboard || !navigator.clipboard.read) {
      return null;
    }
    try {
      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];
      for (const item of clipboardItems) {
        const imageType = Array.from(item.types).find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const extension = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `pasted_image.${extension}`, { type: blob.type });
          imageFiles.push(file);
        }
      }
      return imageFiles;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        toast.error("Permissão para acessar a área de transferência negada.");
      } else {
        console.error("Clipboard API error:", err);
        toast.error("Não foi possível ler da área de transferência.");
      }
      return [];
    }
  }, []);

  const handlePasteButtonClick = useCallback(async () => {
    const files = await readImagesFromClipboard();
    if (files === null) {
      toast.error("Seu navegador não suporta a colagem de imagens diretamente. Use o botão 'Adicionar Imagem'.", { id: 'clipboard-unsupported' });
    } else if (files.length > 0) {
      await processFiles(files);
    } else {
      toast.error("Nenhuma imagem encontrada na área de transferência.", { id: 'no-image-found' });
    }
  }, [readImagesFromClipboard, processFiles]);

  const handlePaste = useCallback(async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const filesFromModernAPI = await readImagesFromClipboard();
    if (filesFromModernAPI && filesFromModernAPI.length > 0) {
      event.preventDefault();
      await processFiles(filesFromModernAPI);
      return;
    }
    if (filesFromModernAPI?.length === 0) return;
    const filesFromFallback: File[] = [];
    if (event.clipboardData) {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) filesFromFallback.push(file);
        }
      }
    }
    if (filesFromFallback.length > 0) {
      event.preventDefault();
      await processFiles(filesFromFallback);
    }
  }, [readImagesFromClipboard, processFiles]);
  
  const handleFileSelected = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processFiles(Array.from(event.target.files));
    }
    if(event.target) event.target.value = '';
  }, [processFiles]);

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleSubmit = () => {
    if (!title && !description && attachments.length === 0) {
      toast.error("Por favor, adicione um título, descrição ou imagem para importar.");
      return;
    }
    const importedData: Partial<Reminder> = {
      title: title || 'Nota importada do Keep',
      description,
      attachments,
      datetime: new Date().toISOString(),
    };
    onComplete(importedData);
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
        onClick={handleSubmit}
        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700 flex items-center gap-2"
      >
        Importar Lembrete
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importar do Google Keep"
      titleIcon={<Clipboard className="text-primary-500" />}
      className="max-w-2xl h-[85vh]"
      footer={modalFooter}
    >
        <div className="space-y-6 h-full" onPaste={handlePaste}>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 text-blue-800 dark:text-blue-200 rounded-lg">
            <p className="font-semibold">Como importar:</p>
            <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
              <li>Abra uma nota no Google Keep.</li>
              <li>Copie o título e a descrição e cole nos campos abaixo.</li>
              <li>Para imagens, use o botão <strong>Colar Imagem</strong> (recomendado) ou <strong>Adicionar Imagem</strong>.</li>
            </ol>
          </div>

          <div>
            <label htmlFor="keep-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Título
            </label>
            <input
              type="text"
              id="keep-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
              placeholder="Cole o título da nota aqui"
            />
          </div>

          <div>
            <label htmlFor="keep-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Descrição
            </label>
            <textarea
              id="keep-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={8}
              className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-800 sm:text-sm"
              placeholder="Cole o conteúdo da nota aqui"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Imagens Anexadas
                </label>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handlePasteButtonClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600"
                    >
                        <ClipboardPaste size={16} />
                        Colar Imagem
                    </button>
                    <button
                        type="button"
                        onClick={handleAddImageClick}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600"
                    >
                        <ImageIcon size={16} />
                        Adicionar Imagem
                    </button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelected}
                    accept="image/*"
                    multiple
                    className="sr-only"
                    aria-hidden="true"
                />
            </div>
            {attachments.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {attachments.map(att => (
                  <div key={att.id} className="relative group">
                    <img src={att.localUrl} alt={att.name} className="w-full h-24 object-cover rounded-md border border-slate-200 dark:border-slate-700" />
                    <button
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover imagem"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md text-slate-500">
                <ImageIcon size={24} />
                <p className="text-sm mt-1">Imagens adicionadas aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>
    </Modal>
  );
};

export default KeepImporterModal;
