import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface ImageViewerProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);

  const reset = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const clampPosition = useCallback((pos: { x: number; y: number }, currentScale: number) => {
    if (!imageRef.current || !containerRef.current || currentScale <= 1) return { x: 0, y: 0 };
    
    const imgRect = imageRef.current.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    const overflowX = (imgRect.width - containerRect.width) / 2;
    const overflowY = (imgRect.height - containerRect.height) / 2;

    const maxX = Math.max(0, overflowX / currentScale);
    const maxY = Math.max(0, overflowY / currentScale);

    return {
      x: Math.max(-maxX, Math.min(maxX, pos.x)),
      y: Math.max(-maxY, Math.min(maxY, pos.y)),
    };
  }, []);
  
  const handleZoom = useCallback((factor: number, clientX: number, clientY: number) => {
    if (!containerRef.current || !imageRef.current) return;
    
    const newScale = Math.max(1, Math.min(scale * factor, 8));
    if (newScale === scale) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    const imageX = (rect.width / 2) + position.x;
    const imageY = (rect.height / 2) + position.y;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const newX = position.x - ((mouseX - imageX) * (newScale - scale) / (scale * newScale));
    const newY = position.y - ((mouseY - imageY) * (newScale - scale) / (scale * newScale));
    
    const newPosition = { x: newX, y: newY };

    setScale(newScale);
    setPosition(newScale === 1 ? { x: 0, y: 0 } : clampPosition(newPosition, newScale));

  }, [scale, position, clampPosition]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    handleZoom(factor, e.clientX, e.clientY);
  }, [handleZoom]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      isPanning.current = true;
      lastPosition.current = { x: e.clientX, y: e.clientY };
      if (imageRef.current) imageRef.current.style.cursor = 'grabbing';
    }
  }, [scale]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return;
    const dx = (e.clientX - lastPosition.current.x);
    const dy = (e.clientY - lastPosition.current.y);
    lastPosition.current = { x: e.clientX, y: e.clientY };
    setPosition(prev => clampPosition({ x: prev.x + dx, y: prev.y + dy }, scale));
  }, [scale, clampPosition]);
  
  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    if (imageRef.current) imageRef.current.style.cursor = 'grab';
  }, []);

  const getPinchDistance = (e: TouchEvent) => {
    return Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY - e.touches[1].pageY);
  };

  const getPinchCenter = (e: TouchEvent) => {
    return {
      x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
      y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      lastPinchDist.current = getPinchDistance(e);
    } else if (e.touches.length === 1 && scale > 1) {
      isPanning.current = true;
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [scale]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      const newDist = getPinchDistance(e);
      const factor = newDist / lastPinchDist.current;
      lastPinchDist.current = newDist;
      const center = getPinchCenter(e);
      handleZoom(factor, center.x, center.y);
    } else if (e.touches.length === 1 && isPanning.current) {
      const dx = (e.touches[0].clientX - lastPosition.current.x);
      const dy = (e.touches[0].clientY - lastPosition.current.y);
      lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPosition(prev => clampPosition({ x: prev.x + dy, y: prev.y + dy }, scale));
    }
  }, [scale, handleZoom, clampPosition]);

  const handleTouchEnd = useCallback(() => {
    isPanning.current = false;
    lastPinchDist.current = 0;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleWheel, handleMouseDown, handleMouseMove, handleMouseUp, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={imageRef}
          className="relative transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? (isPanning.current ? 'grabbing' : 'grab') : 'default',
          }}
        >
            <img
            src={imageUrl}
            alt="Visualização ampliada do anexo"
            className="max-w-[90vw] max-h-[90vh] object-contain shadow-2xl rounded-lg"
            />
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-colors"
        aria-label="Fechar visualizador de imagem"
      >
        <X size={24} />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/50 rounded-full text-white backdrop-blur-sm">
        <button onClick={() => handleZoom(0.8, window.innerWidth / 2, window.innerHeight / 2)} className="p-2 rounded-full hover:bg-white/20" aria-label="Diminuir zoom"><ZoomOut size={24} /></button>
        <button onClick={reset} className="p-2 rounded-full hover:bg-white/20" aria-label="Resetar zoom"><RefreshCw size={20} /></button>
        <button onClick={() => handleZoom(1.2, window.innerWidth / 2, window.innerHeight / 2)} className="p-2 rounded-full hover:bg-white/20" aria-label="Aumentar zoom"><ZoomIn size={24} /></button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        .image-viewer-transform { transform-origin: center; }
      `}</style>
    </div>
  );
};

export default ImageViewer;
