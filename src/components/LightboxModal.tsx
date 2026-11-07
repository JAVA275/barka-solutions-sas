import React from 'react';
import { X, FileText, Tag, User, Calendar } from 'lucide-react';
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
  return (
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
            className="relative bg-slate-900 text-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl z-10 border border-slate-700"
          >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-950/70 text-white hover:bg-orange-500 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Large Image Preview */}
            <div className="relative aspect-16/10 sm:aspect-16/9 w-full bg-slate-950 overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-orange-500 text-white px-3 py-1 rounded-full shadow-md">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Details & Action */}
            <div className="p-6 space-y-4">
              <div>
                <h3
                  className="text-xl sm:text-2xl font-extrabold text-white"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

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
                  <span>Demander un devis pour ce produit</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
