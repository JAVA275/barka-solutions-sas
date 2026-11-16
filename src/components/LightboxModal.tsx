import React, { useState, useEffect } from 'react';
import { X, FileText, Tag, User, Calendar, Maximize2, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioItem } from '../types';

interface LightboxModalProps {
  item: PortfolioItem | null;
  onClose: () => void;
  onRequestQuote: (item: PortfolioItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  item,
  onClose,
  onRequestQuote,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onClose]);

  // Reset fullscreen when item changes or closes
  useEffect(() => {
    setIsFullScreen(false);
  }, [item?.id]);

  return (
    <>
      <AnimatePresence>
        {item && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6" id="portfolio-lightbox-modal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
              onClick={onClose}
              aria-hidden="true"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative bg-slate-900 text-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl z-10 border border-slate-700 my-auto"
            >
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                aria-label="Fermer"
                className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/70 text-white hover:bg-orange-500 transition-colors cursor-pointer shadow-md"
              >
                <X className="w-5 h-5" />
              </motion.button>

              {/* Large Image Preview - Displayed in full without cropping */}
              <div
                className="relative w-full bg-slate-950 flex items-center justify-center min-h-[300px] max-h-[65vh] sm:max-h-[72vh] p-2 sm:p-4 overflow-hidden cursor-zoom-in group select-none border-b border-slate-800"
                onClick={() => setIsFullScreen(true)}
                title="Cliquer pour afficher l'image dans son intégralité en plein écran"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="max-h-[58vh] sm:max-h-[66vh] w-auto max-w-full object-contain mx-auto rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.015]"
                />

                <div className="absolute top-4 left-4 z-10">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-500 text-white px-3 py-1 rounded-full shadow-md">
                    {item.category}
                  </span>
                </div>

                {/* Fullscreen zoom pill indicator */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold border border-slate-700 opacity-90 group-hover:opacity-100 group-hover:bg-orange-500 transition shadow-lg">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Cliquer pour agrandir en plein écran</span>
                </div>
              </div>

              {/* Details & Action */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3
                    className="text-xl sm:text-2xl font-extrabold text-white"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    {item.title}
                  </h3>

                  <button
                    onClick={() => setIsFullScreen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 w-fit cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-orange-400" />
                    <span>Voir l'image intégrale</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  {item.client && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-orange-400" />
                      <span>Client : <strong className="text-white">{item.client}</strong></span>
                    </div>
                  )}
                  {item.year && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-400" />
                      <span>Année : <strong className="text-white">{item.year}</strong></span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <Tag className="w-3.5 h-3.5 text-slate-500 mr-1" />
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action CTA */}
                <div className="pt-3 border-t border-slate-800 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      onRequestQuote(item);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-colors shadow-md cursor-pointer min-h-[44px]"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Passer une commande pour ce produit</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 100% Immersive Full-Screen Lightbox View (Zero Cropping) */}
      <AnimatePresence>
        {isFullScreen && item && (
          <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-lg p-2 sm:p-4 select-none cursor-zoom-out"
            onClick={() => setIsFullScreen(false)}
            id="fullscreen-image-viewer"
          >
            {/* Close full screen */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFullScreen(false);
              }}
              aria-label="Fermer l'affichage intégral"
              className="absolute top-4 right-4 z-[110] p-3 rounded-full bg-white/10 hover:bg-orange-500 text-white transition-colors cursor-pointer shadow-xl border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Complete Image Display Container */}
            <div
              className="relative max-w-[98vw] max-h-[92vh] flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={item.image}
                alt={item.title}
                className="max-w-[96vw] max-h-[86vh] w-auto h-auto object-contain rounded-lg shadow-2xl border border-white/10"
              />
              <div className="mt-3 flex items-center gap-3 text-center text-xs text-slate-300 bg-slate-900/90 px-4 py-1.5 rounded-full backdrop-blur-md border border-slate-700 shadow-lg">
                <span className="font-extrabold text-white">{item.title}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-semibold">{item.category}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 text-[11px]">Affichage intégral sans recadrage</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
