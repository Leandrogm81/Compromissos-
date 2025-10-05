import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * A reusable hook to handle pasting image files from the clipboard.
 * @param onPaste - A callback function that receives an array of `File` objects when images are successfully pasted.
 * @returns An object with a `pasteFromClipboard` function to trigger the paste action and an `isReading` boolean for loading states.
 */
export const useClipboardPaste = (onPaste: (files: File[]) => void) => {
  const [isReading, setIsReading] = useState(false);

  const pasteFromClipboard = useCallback(async () => {
    // Check for modern Clipboard API support with `read` method.
    if (!navigator.clipboard || !navigator.clipboard.read) {
      toast.error("Seu navegador não suporta esta funcionalidade de colar.", { id: 'clipboard-unsupported' });
      return;
    }

    setIsReading(true);
    try {
      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];

      for (const item of clipboardItems) {
        // Find the first image type in the clipboard item's types.
        const imageType = Array.from(item.types).find(type => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const extension = blob.type.split('/')[1] || 'png';
          // Create a File object from the blob with a descriptive name.
          const file = new File([blob], `pasted_image_${Date.now()}.${extension}`, { type: blob.type });
          imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        onPaste(imageFiles);
      } else {
        toast.error("Nenhuma imagem encontrada na área de transferência.", { id: 'no-image-found' });
      }
    } catch (err: any) {
      // Handle potential permission errors gracefully.
      if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        toast.error("Permissão para acessar a área de transferência foi negada. Por favor, permita o acesso nas configurações do seu navegador.", { id: 'clipboard-permission' });
      } else {
        console.error("Clipboard API error:", err);
        toast.error("Não foi possível ler da área de transferência.", { id: 'clipboard-error' });
      }
    } finally {
      setIsReading(false);
    }
  }, [onPaste]);
  
  return { pasteFromClipboard, isReading };
};
