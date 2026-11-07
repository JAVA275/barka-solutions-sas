import React from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const FloatingWhatsApp: React.FC = () => {
  const whatsappUrl = `https://wa.me/237671234567?text=Bonjour%20Imprimerie%20Pro%2C%20je%20souhaite%20obtenir%20des%20renseignements%20sur%20vos%20prestations%20d%27impression.`;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 select-none">
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discuter sur WhatsApp avec BARKA SOLUTIONS S.A.S"
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.94 }}
        className="relative group flex items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-600/30 cursor-pointer"
        id="floating-whatsapp-btn"
      >
        {/* Subtle, soft breathing pulse ring */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none"
          style={{ animationDuration: '3s' }}
        />

        {/* WhatsApp Icon */}
        <MessageCircle className="w-7 h-7 fill-current relative z-10" />

        {/* Floating Tooltip Pill on Desktop Hover */}
        <span className="hidden sm:inline-block absolute right-full mr-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Discuter sur WhatsApp
          <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </span>
      </motion.a>
    </div>
  );
};
