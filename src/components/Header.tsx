import React, { useState, useEffect } from 'react';
import {
  Menu,
  Phone,
  Mail,
  MapPin,
  Home,
  ChevronDown,
  Send,
  Facebook,
  Youtube,
  Linkedin,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { BarkaLogo } from './BarkaLogo';
import { TabType } from '../types';

interface HeaderProps {
  onOpenMenu: () => void;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  activeTab,
  onSelectTab,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full select-none" id="main-app-header">
      {/* 1. TOP DARK BAR (Exact mockup match) */}
      <div className="bg-[#051329] text-white text-[11px] sm:text-xs py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-2">
          {/* Left contact coordinates */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-start">
            <a
              href="tel:+237671234567"
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-cyan-400" />
              <span>+237 6 71 23 45 67</span>
            </a>

            <span className="text-slate-600 hidden sm:inline">|</span>

            <a
              href="mailto:contact@imprimerie-pro.cm"
              className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>contact@imprimerie-pro.cm</span>
            </a>

            <span className="text-slate-600 hidden md:inline">|</span>

            <div className="hidden md:flex items-center gap-1.5 text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ngaoundéré, Cameroun</span>
            </div>
          </div>

          {/* Right social icons */}
          <div className="flex items-center gap-2.5">
            <span className="text-slate-300 font-medium hidden sm:inline">Suivez-nous :</span>
            <div className="flex items-center gap-1.5">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-6 h-6 rounded-full bg-white text-[#051329] hover:bg-cyan-400 hover:text-white transition-colors flex items-center justify-center text-[11px]"
              >
                <Facebook className="w-3.5 h-3.5 fill-current" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-6 h-6 rounded-full bg-white text-[#051329] hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center text-[11px]"
              >
                <Youtube className="w-3.5 h-3.5 fill-current" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-6 h-6 rounded-full bg-white text-[#051329] hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center text-[11px]"
              >
                <Linkedin className="w-3.5 h-3.5 fill-current" />
              </a>
              <a
                href="https://wa.me/237671234567"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-6 h-6 rounded-full bg-white text-[#051329] hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center text-[11px]"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVBAR (White Background) */}
      <div
        className={`bg-white transition-all duration-300 border-b border-slate-200/80 ${
          isScrolled ? 'shadow-md py-1' : 'shadow-xs py-2'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <button
              onClick={() => onSelectTab('accueil')}
              className="flex items-center text-left focus:outline-hidden group cursor-pointer shrink-0"
              id="header-logo-btn"
            >
              <BarkaLogo size="md" />
            </button>

            {/* Desktop Navigation Menu matching Mockup */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
              {/* Accueil pill with home icon */}
              <button
                onClick={() => onSelectTab('accueil')}
                id="desktop-nav-accueil"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'accueil'
                    ? 'bg-[#0b244d] text-white shadow-md'
                    : 'text-slate-700 hover:text-[#0b244d] hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </button>

              {/* Nos Services with dropdown arrow */}
              <button
                onClick={() => onSelectTab('services')}
                id="desktop-nav-services"
                className={`flex items-center gap-1 px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'services'
                    ? 'text-[#0066cc] bg-blue-50'
                    : 'text-slate-700 hover:text-[#0066cc] hover:bg-slate-100'
                }`}
              >
                <span>Nos Services</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* Nos Réalisations */}
              <button
                onClick={() => onSelectTab('galerie')}
                id="desktop-nav-galerie"
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'galerie'
                    ? 'text-[#0066cc] bg-blue-50'
                    : 'text-slate-700 hover:text-[#0066cc] hover:bg-slate-100'
                }`}
              >
                Nos Réalisations
              </button>

              {/* À propos */}
              <button
                onClick={() => onSelectTab('apropos')}
                id="desktop-nav-apropos"
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'apropos'
                    ? 'text-[#0066cc] bg-blue-50'
                    : 'text-slate-700 hover:text-[#0066cc] hover:bg-slate-100'
                }`}
              >
                À propos
              </button>

              {/* Contact */}
              <button
                onClick={() => onSelectTab('contact')}
                id="desktop-nav-contact"
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'contact'
                    ? 'text-[#0066cc] bg-blue-50'
                    : 'text-slate-700 hover:text-[#0066cc] hover:bg-slate-100'
                }`}
              >
                Contact
              </button>
            </nav>

            {/* Right Action: Vibrant Magenta "Passer une commande" CTA Button */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectTab('devis')}
                id="header-quote-cta"
                className="hidden sm:inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-xs font-extrabold bg-[#e6006e] hover:bg-[#cf0063] text-white shadow-md shadow-pink-500/25 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 fill-current rotate-45" />
                <span>Passer une commande</span>
              </motion.button>

              {/* Mobile Menu Hamburger */}
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={onOpenMenu}
                aria-label="Ouvrir le menu"
                id="hamburger-menu-btn"
                className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors focus:outline-hidden cursor-pointer border border-slate-200"
              >
                <Menu className="w-6 h-6 stroke-[2.5]" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
