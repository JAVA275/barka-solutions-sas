import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const Preloader: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fast elegant reveal (750ms) to enhance perceived premium quality without blocking UX
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 750);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="app-preloader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#071d3f] text-white select-none pointer-events-none"
          id="app-preloader-screen"
        >
          {/* Animated Official Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-white/95 rounded-3xl p-4 shadow-2xl border border-white/20 mb-4"
          >
            <img
              src="/barka-logo.png"
              alt="BARKA SOLUTIONS S.A.S"
              className="h-24 sm:h-28 w-auto object-contain"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-xs sm:text-sm text-slate-200 font-semibold tracking-wide text-center px-4"
          >
            Imprimerie & Communication Visuelle à Ngaoundéré
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
