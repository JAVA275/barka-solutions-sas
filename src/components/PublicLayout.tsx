import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DrawerMenu } from './DrawerMenu';
import { Footer } from './Footer';
import { ScrollProgressBar } from './ScrollProgressBar';
import { FloatingWhatsApp } from './FloatingWhatsApp';
import { Preloader } from './Preloader';
import { pathToTab, tabToPath } from '../utils/navigation';
import { TabType } from '../types';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeTab = pathToTab(location.pathname);

  const handleSelectTab = (tab: TabType) => {
    const targetPath = tabToPath(tab);
    navigate(targetPath);
  };

  const handleOpenAdmin = () => {
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-[#0010c2] selection:text-white">
      {/* Brand CMYK Preloader on initial load */}
      <Preloader />

      {/* Top Scroll Progress Bar */}
      <ScrollProgressBar />

      {/* Top Main Header with scroll elevate */}
      <Header
        onOpenMenu={() => setIsMenuOpen(true)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Dynamic View Area with smooth page transition */}
      <main className="flex-1 pb-16 sm:pb-6 overflow-x-hidden">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Floating WhatsApp Action Button with soft ping breathing ring */}
      <FloatingWhatsApp />

      {/* Desktop & Mobile Footer */}
      <Footer
        onSelectTab={handleSelectTab}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Persistent Bottom Navigation Bar on Small Screens (Fixed Bottom with Safe Area) */}
      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* Side Navigation Drawer Menu */}
      <DrawerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAdmin={handleOpenAdmin}
      />
    </div>
  );
};
