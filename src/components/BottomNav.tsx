import React from 'react';
import { Home, LayoutGrid, Tag, FileText, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const navItems = [
    { id: 'accueil' as TabType, label: 'Accueil', icon: Home },
    { id: 'services' as TabType, label: 'Services', icon: LayoutGrid },
    { id: 'tarifs' as TabType, label: 'Tarifs', icon: Tag },
    { id: 'devis' as TabType, label: 'Devis', icon: FileText },
    { id: 'contact' as TabType, label: 'Contact', icon: MapPin },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md text-white border-t border-slate-800 shadow-2xl py-1 px-1 sm:hidden pb-[max(0.35rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <motion.button
              whileTap={{ scale: 0.92 }}
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              id={`bottom-nav-${item.id}`}
              className={`min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors duration-200 cursor-pointer relative ${
                isActive
                  ? 'text-orange-500 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeBottomTabPill"
                  className="absolute inset-0.5 bg-orange-500/10 rounded-xl border border-orange-500/20"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <motion.div
                animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative z-10"
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              </motion.div>
              <span className="text-[10px] mt-1 tracking-tight font-medium leading-none relative z-10">
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

