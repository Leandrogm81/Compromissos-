import React, { useCallback, useState, useMemo, useEffect } from 'react';
import type { Attachment } from '../types';
import { calculateFileHash } from '../services/fileService';
import { Paperclip, X, FileText, Image as ImageIcon, AlertTriangle, ClipboardPaste, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useClipboardPaste } from '../hooks/useClipboardPaste';

interface AttachmentUploaderProps {
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_TOTAL_SIZE_MB = 25;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({ attachments, setAttachments }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  useEffect(() => {
    // This effect's cleanup is now correctly scoped to the attachments it's managing.
    // When the component unmounts, it revokes URLs for the last set of attachments it displayed.
    // When attachments change, it revokes the old ones and the effect for the new state sets up the next cleanup.
    return () => {
        attachments.forEach(att => {
            if (att.localUrl) {
                URL.revokeObjectURL(att.localUrl);
            }
        });
    };
  }, [attachments]);

  const currentStats = useMemo(() => {
    const count = attachments.length;
    const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
    return { count, totalSize };
  }, [attachments]);
  
  const handleFileProcessing = useCallback(async (files: File[]) => {
    const newAttachments: Attachment[] = [];
    let runningSize = currentStats.totalSize;
    let runningCount = currentStats.count;
    const validationErrors: string[] = [];
    
    for (const file of files) {
      if (runningCount >= MAX_FILES) {
        validationErrors.push(`Limite de ${MAX_FILES} arquivos atingido.`);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        validationErrors.push(`"${file.name}": Tipo de arquivo não suportado.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        validationErrors.push(`"${file.name}": Excede o limite de ${MAX_SIZE_MB}MB por arquivo.`);
        continue;
      }
      if (runningSize + file.size > MAX_TOTAL_SIZE_BYTES) {
        validationErrors.push(`"${file.name}": Excederia o limite total de ${MAX_TOTAL_SIZE_MB}MB.`);
        break;
      }

      runningSize += file.size;
      runningCount += 1;
      
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
    }
    
    if (validationErrors.length > 0) {
        const errorsToShow = validationErrors.slice(0, 3);
        const remainingErrors = validationErrors.length - errorsToShow.length;
        let errorMessage = errorsToShow.join('\n');
        if (remainingErrors > 0) {
            errorMessage += `\nE mais ${remainingErrors} erro(s).`;
        }
        toast.error(errorMessage, { duration: 5000 });
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
      toast.success(`${newAttachments.length} arquivo(s) adicionado(s) com sucesso.`);
    }

  }, [currentStats, setAttachments]);
  
  const { pasteFromClipboard, isReading } = useClipboardPaste(handleFileProcessing);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileProcessing(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileProcessing(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleRemoveAttachment = (id: string) => {
    const attachmentToRemove = attachments.find(att => att.id === id);
    if (attachmentToRemove && attachmentToRemove.localUrl) {
        URL.revokeObjectURL(attachmentToRemove.localUrl);
    }
    setAttachments(prev => prev.filter(att => att.id !== id));
  };
  
  const hasReachedLimit = currentStats.count >= MAX_FILES || currentStats.totalSize >= MAX_TOTAL_SIZE_BYTES;
  
  return (
    <div className="mt-2 space-y-3">
        {hasReachedLimit && (
            <div className="flex items-center gap-2 p-3 text-sm text-yellow-800 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900/40 rounded-md">
                <AlertTriangle size={18} />
                <span>Você atingiu o limite de arquivos ou de armazenamento.</span>
            </div>
        )}
        
        {!hasReachedLimit && (
            <div className="space-y-2">
                <label
                    htmlFor="file-upload"
                    onDragEnter={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`
                    flex flex-col justify-center items-center w-full px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer
                    ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}
                    `}
                >
                    <div className="space-y-1 text-center">
                        <Paperclip className="mx-auto h-8 w-8 text-slate-400" />
                        <div className="flex text-sm text-slate-600 dark:text-slate-400">
                        <p>Arraste e solte ou <span className="text-primary-600 dark:text-primary-400 font-semibold">procure arquivos</span></p>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                        </div>
                        <p className="text-xs text-slate-500">Imagens e PDF, até {MAX_SIZE_MB} cada.</p>
                    </div>
                </label>
                 <button
                    type="button"
                    onClick={pasteFromClipboard}
                    disabled={isReading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 disabled:opacity-50"
                >
                    {isReading ? <Loader2 size={16} className="animate-spin" /> : <ClipboardPaste size={16} />}
                    {isReading ? 'Lendo...' : 'Colar Imagem da Área de Transferência'}
                </button>
            </div>
        )}
      
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
            Arquivos: {currentStats.count} / {MAX_FILES}
        </span>
        <span>
            Armazenamento: {(currentStats.totalSize / 1024 / 1024).toFixed(1)} / {MAX_TOTAL_SIZE_MB} MB
        </span>
      </div>
      
      {attachments.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
              <div className="flex items-center gap-3 overflow-hidden">
                {att.type.startsWith('image/') ? (
                  <img src={att.localUrl} alt={att.name} className="w-10 h-10 object-cover rounded flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-600 rounded flex-shrink-0">
                    <FileText className="text-slate-500" size={20} />
                  </div>
                )}
                <div className="text-sm overflow-hidden">
                  <p className="font-medium truncate">{att.name}</p>
                  <p className="text-xs text-slate-500">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => handleRemoveAttachment(att.id)} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 flex-shrink-0" aria-label="Remover anexo">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentUploader;