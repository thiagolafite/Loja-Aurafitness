import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LightboxContextType {
  openLightbox: (images: string[] | string, initialIndex?: number, title?: string) => void;
  closeLightbox: () => void;
}

const LightboxContext = createContext<LightboxContextType | undefined>(undefined);

export const LightboxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageList, setImageList] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageTitle, setImageTitle] = useState<string>('');

  const openLightbox = (images: string[] | string, initialIndex = 0, title = '') => {
    const list = Array.isArray(images)
      ? images.filter(Boolean)
      : [images].filter(Boolean);

    if (list.length === 0) return;

    setImageList(list);
    setCurrentIndex(Math.max(0, Math.min(initialIndex, list.length - 1)));
    setImageTitle(title);
    setIsOpen(true);
  };

  const closeLightbox = () => {
    setIsOpen(false);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % imageList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  // Keyboard navigation & lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, imageList.length]);

  return (
    <LightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}

      <AnimatePresence>
        {isOpen && imageList.length > 0 && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              className="fixed inset-0 bg-black/92 backdrop-blur-md cursor-pointer"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="relative max-w-5xl max-h-[94vh] w-full flex flex-col items-center justify-center z-10 pointer-events-auto"
            >
              {/* Header Bar */}
              <div className="w-full flex items-center justify-between text-white pb-3 px-2">
                <div className="space-y-0.5">
                  {imageTitle && (
                    <h4 className="font-serif font-bold text-base sm:text-lg text-white drop-shadow truncate max-w-xs sm:max-w-md">
                      {imageTitle}
                    </h4>
                  )}
                  {imageList.length > 1 && (
                    <span className="text-xs text-amber-200/90 font-mono font-semibold">
                      Foto {currentIndex + 1} de {imageList.length}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={closeLightbox}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                    title="Fechar (Esc)"
                  >
                    <X className="w-5 h-5" />
                    <span className="hidden sm:inline">Fechar</span>
                  </button>
                </div>
              </div>

              {/* Main Image Frame */}
              <div className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/50 border border-white/10 shadow-2xl">
                <img
                  src={imageList[currentIndex]}
                  alt={imageTitle || 'Imagem do produto ampliada'}
                  className="max-h-[76vh] w-auto max-w-full object-contain rounded-xl transition-all select-none"
                />

                {/* Left Arrow */}
                {imageList.length > 1 && (
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all hover:scale-110 shadow-xl border border-white/20"
                    title="Foto anterior (←)"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {/* Right Arrow */}
                {imageList.length > 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-white transition-all hover:scale-110 shadow-xl border border-white/20"
                    title="Próxima foto (→)"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Thumbnail Strip if multiple images */}
              {imageList.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto max-w-full py-1 px-2 scrollbar-none">
                  {imageList.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`relative w-12 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        idx === currentIndex
                          ? 'border-amber-400 scale-105 shadow-md'
                          : 'border-white/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LightboxContext.Provider>
  );
};

export const useLightbox = () => {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error('useLightbox must be used within a LightboxProvider');
  }
  return context;
};
