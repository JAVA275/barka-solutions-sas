import React from 'react';
import {
  X,
  Home,
  LayoutGrid,
  Tag,
  Image as ImageIcon,
  FileText,
  Info,
  Mail,
  Phone,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarkaLogo } from './BarkaLogo';
import { TabType } from '../types';
import { COMPANY_INFO } from '../data/mockData';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAdmin: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onOpenAdmin,
}) => {
  const menuItems = [
    { id: 'accueil' as TabType, label: 'Accueil', icon: Home },
    { id: 'services' as TabType, label: 'Nos services', icon: LayoutGrid },
    { id: 'tarifs' as TabType, label: 'Grille tarifaire', icon: Tag },
    { id: 'galerie' as TabType, label: 'Nos Réalisations', icon: ImageIcon },
    { id: 'devis' as TabType, label: 'Passer une commande', icon: FileText },
    { id: 'apropos' as TabType, label: 'À propos', icon: Info },
    { id: 'contact' as TabType, label: 'Contact', icon: Mail },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end" id="drawer-menu-container">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-sm bg-slate-900 text-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-800 z-10"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800">
                <BarkaLogo variant="dark" size="sm" />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  aria-label="Fermer le menu"
                  id="drawer-close-btn"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Navigation Links */}
              <nav className="p-4 space-y-1.5" id="drawer-nav-list">
                {menuItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <motion.button
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 + idx * 0.035, duration: 0.3 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      id={`drawer-link-${item.id}`}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-orange-400'}`} />
                      <span>{item.label}</span>
                    </motion.button>
                  );
                })}

                {/* Admin Back-office link */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  className="pt-3"
                >
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    id="drawer-link-admin"
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all border border-slate-800 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Espace Administration</span>
                  </button>
                </motion.div>
              </nav>
            </div>

            {/* Footer Area */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/60 space-y-3">
              {/* Direct Phone Call Button */}
              <a
                href={`tel:${COMPANY_INFO.phone1}`}
                id="drawer-phone-btn"
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm transition-colors border border-slate-700"
              >
                <Phone className="w-4 h-4 text-orange-400" />
                <span>{COMPANY_INFO.phone1}</span>
              </a>

              {/* Direct WhatsApp Button */}
              <a
                href={`https://wa.me/${(COMPANY_INFO.whatsapp_raw || COMPANY_INFO.whatsapp || '237696311198').replace(/\D/g, '')}?text=Bonjour%20BARKA%20SOLUTIONS%2C%20je%20souhaite%20obtenir%20des%20informations.`}
                target="_blank"
                rel="noopener noreferrer"
                id="drawer-wa-btn"
                className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>WhatsApp direct</span>
              </a>

              <p className="text-[11px] text-center text-slate-500 pt-1">
                © 2026 BARKA SOLUTIONS S.A.S — Ngaoundéré
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
