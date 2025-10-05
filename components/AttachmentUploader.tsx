
import React, { useCallback, useState } from 'react';
import type { Attachment } from '../types';
import { calculateFileHash } from '../services/fileService';
import { Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface AttachmentUploaderProps {
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}

const MAX_FILES = 5;
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({ attachments, setAttachments }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFileProcessing = useCallback(async (files: FileList) => {
    const newAttachments: Attachment[] = [];
    
    for (const file of Array.from(files)) {
      if (attachments.length + newAttachments.length >= MAX_FILES) {
        toast.error(`Você pode anexar no máximo ${MAX_FILES} arquivos.`);
        break;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Tipo de arquivo não suportado: ${file.name}`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`O arquivo ${file.name} excede o limite de ${MAX_SIZE_MB}MB.`);
        continue;
      }

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

    setAttachments(prev => [...prev, ...newAttachments]);
  }, [attachments, setAttachments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileProcessing(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileProcessing(e.dataTransfer.files);
    }
  };
  
  const handleRemoveAttachment = (id: string) => {
    const attachmentToRemove = attachments.find(att => att.id === id);
    if (attachmentToRemove && attachmentToRemove.localUrl) {
        URL.revokeObjectURL(attachmentToRemove.localUrl);
    }
    setAttachments(prev => prev.filter(att => att.id !== id));
  };
  
  return (
    <div className="mt-2 space-y-3">
        <label
            htmlFor="file-upload"
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`
            flex justify-center items-center w-full px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer
            ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}
            `}
        >
        <div className="space-y-1 text-center">
            <Paperclip className="mx-auto h-8 w-8 text-slate-400" />
            <div className="flex text-sm text-slate-600 dark:text-slate-400">
            <p>Arraste e solte ou <span className="text-primary-600 dark:text-primary-400 font-semibold">procure arquivos</span></p>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
            </div>
            <p className="text-xs text-slate-500">Imagens e PDF, até {MAX_SIZE_MB}MB cada.</p>
        </div>
        </label>
      
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
              <div className="flex items-center gap-3">
                {att.type.startsWith('image/') ? (
                  <img src={att.localUrl} alt={att.name} className="w-10 h-10 object-cover rounded" />
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-slate-600 rounded">
                    <FileText className="text-slate-500" size={20} />
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-medium truncate max-w-[200px]">{att.name}</p>
                  <p className="text-xs text-slate-500">{(att.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button onClick={() => handleRemoveAttachment(att.id)} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600">
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
