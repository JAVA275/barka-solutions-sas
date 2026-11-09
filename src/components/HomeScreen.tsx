import React from 'react';
import {
  Zap,
  Award,
  Headphones,
  Handshake,
  ChevronRight,
  ArrowRight,
  Trophy,
  FileText,
  BookOpen,
  CreditCard,
  Maximize2,
  Flag,
  Shirt,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType, PortfolioItem } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import { PORTFOLIO_DATA } from '../data/mockData';

interface HomeScreenProps {
  onSelectTab: (tab: TabType) => void;
  onOpenLightbox?: (item: PortfolioItem) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectTab, onOpenLightbox }) => {
  const serviceCards = [
    {
      id: 'flyers-depliants',
      title: 'Flyers & Dépliants',
      icon: FileText,
      image:
        'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'brochures-catalogues',
      title: 'Brochures & Catalogues',
      icon: BookOpen,
      image:
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'cartes-visite',
      title: 'Cartes de visite',
      icon: CreditCard,
      image:
        'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'affiches-posters',
      title: 'Affiches & Posters',
      icon: Maximize2,
      image:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'rollup-bannieres',
      title: 'Roll-up & Bannières',
      icon: Flag,
      image:
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'impression-textile',
      title: 'Impression textile',
      icon: Shirt,
      image:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // Top 4 showcase portfolio projects for the gallery motion
  const showcaseProjects = PORTFOLIO_DATA.slice(0, 4);

  return (
    <div className="space-y-10 sm:space-y-14 pb-8" id="home-screen-content">
      {/* 1. HERO SECTION WITH CMYK WAVE & CINEMATIC REVEAL (Exact Mockup Match) */}
      <section className="relative overflow-hidden bg-[#071d3f] text-white" id="hero-section">
        <div className="relative max-w-7xl mx-auto min-h-[460px] sm:min-h-[520px] lg:min-h-[580px] flex flex-col lg:flex-row items-center">
          {/* Background Printer Photo on Right with Zoom Reveal */}
          <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[60%] h-full z-0 overflow-hidden">
            <motion.img
              initial={{ scale: 1.18, opacity: 0 }}
              animate={{ scale: 1.05, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=85"
              alt="Imprimante industrielle grand format - Imprimerie Pro"
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient overlays for smooth blending */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#071d3f] via-[#071d3f]/40 to-transparent z-1 hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071d3f] via-transparent to-transparent z-1 lg:hidden" />
          </div>

          {/* Dynamic CMYK Ribbons Wave (Vector Curve separating Dark Blue and Printer) */}
          <div className="absolute inset-0 pointer-events-none z-10 hidden lg:block">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 600"
              fill="none"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Deep Navy Curved Backdrop Shape */}
              <path
                d="M 0 0 L 520 0 C 660 140, 590 400, 480 600 L 0 600 Z"
                fill="#071d3f"
              />
              {/* Cyan Arc */}
              <path
                d="M 520 0 C 660 140, 590 400, 480 600"
                stroke="#00B4D8"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Magenta / Pink Arc */}
              <path
                d="M 532 0 C 672 140, 602 400, 492 600"
                stroke="#E6007E"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Yellow Arc */}
              <path
                d="M 544 0 C 684 140, 614 400, 504 600"
                stroke="#FFD000"
                strokeWidth="12"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Left Hero Content with Fade-Up & Staggered Reveal */}
          <div className="relative z-20 px-5 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-20 max-w-2xl text-left">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-4xl lg:text-[48px] font-black tracking-tight leading-[1.14]"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Votre partenaire
              <br />
              pour une impression
              <br />
              <span className="text-[#ffd000] relative inline-block">
                de qualité professionnelle
                {/* Yellow wave underline accent */}
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#ffd000]"
                  viewBox="0 0 340 14"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M 2 8 Q 170 14 338 6"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-xs sm:text-sm lg:text-base text-slate-200 font-medium leading-relaxed max-w-lg"
            >
              Flyers, affiches, brochures, cartes de visite, dépliants...
              <br />
              Donnez vie à vos idées avec une impression moderne,
              <br />
              rapide et sur tous supports.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 flex items-center gap-3 flex-wrap"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectTab('services')}
                id="hero-btn-decouvrir"
                className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#ffd000] hover:bg-[#ffc400] text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
              >
                <span>Découvrir nos services</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectTab('devis')}
                id="hero-btn-devis"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm tracking-wide border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
              >
                <span>Passer une commande</span>
              </motion.button>
            </motion.div>
          </div>

          {/* Shiny Golden Seal Medal: "QUALITÉ GARANTIE" (Center overlap between dark blue & printer) */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.35, type: 'spring', stiffness: 120 }}
            className="absolute left-[48%] sm:left-[50%] lg:left-[47%] bottom-4 sm:bottom-6 lg:top-[38%] -translate-x-1/2 z-25 pointer-events-none drop-shadow-2xl"
          >
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
              <svg
                viewBox="0 0 160 160"
                className="w-full h-full drop-shadow-xl"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Metallic Gold Gradient */}
                  <linearGradient id="goldOuter" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFF176" />
                    <stop offset="25%" stopColor="#FBC02D" />
                    <stop offset="50%" stopColor="#F57F17" />
                    <stop offset="75%" stopColor="#FBC02D" />
                    <stop offset="100%" stopColor="#FFF59D" />
                  </linearGradient>

                  <linearGradient id="goldInner" x1="20" y1="20" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FDD835" />
                    <stop offset="50%" stopColor="#F57F17" />
                    <stop offset="100%" stopColor="#C47300" />
                  </linearGradient>
                </defs>

                {/* Scalloped / Starburst gold medal edge */}
                <circle cx="80" cy="80" r="74" fill="url(#goldOuter)" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#5D4037"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  fill="#111827"
                />
                <circle cx="80" cy="80" r="62" fill="url(#goldInner)" />
                <circle cx="80" cy="80" r="56" fill="#0C1425" stroke="#FDD835" strokeWidth="2" />

                {/* 5 Golden Stars */}
                <g fill="#FDD835">
                  <polygon points="56,44 58,50 64,50 59,54 61,60 56,56 51,60 53,54 48,50 54,50" transform="scale(0.7) translate(16,10)" />
                  <polygon points="68,38 70,44 76,44 71,48 73,54 68,50 63,54 65,48 60,44 66,44" transform="scale(0.7) translate(28,6)" />
                  <polygon points="80,34 82,40 88,40 83,44 85,50 80,46 75,50 77,44 72,40 78,40" transform="scale(0.75) translate(27,5)" />
                  <polygon points="92,38 94,44 100,44 95,48 97,54 92,50 87,54 89,48 84,44 90,44" transform="scale(0.7) translate(37,6)" />
                  <polygon points="104,44 106,50 112,50 107,54 109,60 104,56 99,60 101,54 96,50 102,50" transform="scale(0.7) translate(46,10)" />
                </g>

                {/* Text: QUALITÉ GARANTIE */}
                <text
                  x="80"
                  y="82"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="13"
                  fontWeight="900"
                  letterSpacing="1"
                  fontFamily="sans-serif"
                >
                  QUALITÉ
                </text>
                <text
                  x="80"
                  y="99"
                  textAnchor="middle"
                  fill="#FDD835"
                  fontSize="12"
                  fontWeight="900"
                  letterSpacing="1.2"
                  fontFamily="sans-serif"
                >
                  GARANTIE
                </text>

                {/* Bottom decorative gold ribbon / laurels */}
                <path
                  d="M 52 110 C 66 118, 94 118, 108 110"
                  stroke="#FDD835"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="80" cy="114" r="2.5" fill="#FDD835" />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. FLOATING WHITE 4-FEATURE PILL CONTAINER (Exact Mockup Match) */}
      <section className="px-3 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-30" id="floating-features-bar">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-6xl mx-auto bg-white rounded-3xl lg:rounded-full p-4 sm:p-6 shadow-xl border border-slate-200/90"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 lg:divide-x divide-slate-100">
            {/* 1. Impression rapide */}
            <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3.5 px-2 py-1 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#0066cc] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/25">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                  Impression rapide
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Vos travaux livrés dans les meilleurs délais
                </p>
              </div>
            </motion.div>

            {/* 2. Qualité supérieure */}
            <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3.5 px-2 py-1 pt-3 sm:pt-1 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#e6007e] text-white flex items-center justify-center shrink-0 shadow-md shadow-pink-500/25">
                <Award className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                  Qualité supérieure
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Des rendus impeccables et durables
                </p>
              </div>
            </motion.div>

            {/* 3. Accompagnement dédié */}
            <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3.5 px-2 py-1 pt-3 sm:pt-1 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#00b4d8] text-white flex items-center justify-center shrink-0 shadow-md shadow-cyan-500/25">
                <Headphones className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                  Accompagnement dédié
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Une équipe à votre écoute
                </p>
              </div>
            </motion.div>

            {/* 4. Prix compétitifs */}
            <motion.div whileHover={{ y: -2 }} className="flex items-center gap-3.5 px-2 py-1 pt-3 sm:pt-1 transition-all">
              <div className="w-12 h-12 rounded-full bg-[#ff007f] text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/25">
                <Handshake className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                  Prix compétitifs
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Le meilleur rapport qualité-prix
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 3. SECTION "Nos Services" (Exact 6 Cards Grid Match with Stagger Reveal) */}
      <section className="px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6" id="services-section">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header with CMYK Tri-color indicator */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center gap-1.5 mb-1">
              <span className="w-5 h-1.5 rounded-full bg-[#00b4d8]" />
              <span className="w-5 h-1.5 rounded-full bg-[#e6007e]" />
              <span className="w-4 h-1.5 rounded-full bg-[#ffd000]" />
            </div>
            <h2
              className="text-2xl sm:text-3xl font-black text-[#0b244d] tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Nos Services
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Une large gamme de services d'impression pour tous vos besoins
            </p>
          </div>

          {/* 6 Services Grid matching Mockup with Stagger Reveal */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {serviceCards.map((service, idx) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  whileHover={{ y: -5 }}
                  onClick={() => onSelectTab('services')}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-xl hover:shadow-blue-900/10 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  {/* Service Photo with slight zoom on hover */}
                  <div className="aspect-4/3 w-full overflow-hidden bg-slate-100 relative">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-blue-950/0 group-hover:bg-blue-950/10 transition-colors duration-300" />
                  </div>

                  {/* Card Bottom Pill Bar with Arrow displacement on hover */}
                  <div className="p-2.5 sm:p-3 flex items-center justify-between gap-1.5 bg-white border-t border-slate-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Icon className="w-4 h-4 text-[#0066cc] shrink-0 stroke-[2.2]" />
                      <span className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">
                        {service.title}
                      </span>
                    </div>

                    {/* Dark Navy Circular Arrow Button with sliding arrow */}
                    <div className="w-6 h-6 rounded-full bg-[#0b244d] text-white flex items-center justify-center shrink-0 group-hover:bg-[#0066cc] transition-colors overflow-hidden">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. CHIFFRES CLÉS – COUNT UP (Animated once with useInView) */}
      <section className="px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4" id="stats-section">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#071d3f] to-[#041226] text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800 relative overflow-hidden"
          >
            {/* Ambient CMYK corner glows */}
            <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-8">
              {/* Header */}
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#ffd000] text-xs font-bold border border-white/15">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Performance & Savoir-faire</span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-black text-white tracking-tight"
                  style={{ fontFamily: 'Outfit, sans-serif' }}
                >
                  L'excellence industrielle en quelques chiffres
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  Des résultats concrets qui témoignent de notre engagement quotidien auprès des entreprises et institutions.
                </p>
              </div>

              {/* 4 Key Count-Up Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* 1. Clients fidèles */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-white/10 text-center flex flex-col items-center justify-center transition-all group hover:border-cyan-400/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2.5">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <AnimatedCounter to={500} prefix="+" duration={1.4} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
                    Clients satisfaits
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Entreprises, PME & institutions
                  </p>
                </motion.div>

                {/* 2. Projets & Tirages réalisés */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-white/10 text-center flex flex-col items-center justify-center transition-all group hover:border-pink-500/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-2.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <AnimatedCounter to={15000} prefix="+" duration={1.6} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
                    Tirages & commandes
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports imprimés & façonnés
                  </p>
                </motion.div>

                {/* 3. Années d'expérience */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-white/10 text-center flex flex-col items-center justify-center transition-all group hover:border-amber-400/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-[#ffd000] flex items-center justify-center mb-2.5">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <AnimatedCounter to={10} suffix="+" duration={1.2} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
                    Années d'expérience
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Atelier et maîtrise industrielle
                  </p>
                </motion.div>

                {/* 4. Taux de satisfaction */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="bg-white/5 backdrop-blur-xs rounded-2xl p-4 sm:p-5 border border-white/10 text-center flex flex-col items-center justify-center transition-all group hover:border-emerald-400/40"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#ffd000] tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <AnimatedCounter to={99} suffix=".8%" duration={1.3} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200 mt-1">
                    Qualité & satisfaction
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Contrôle qualité strict à chaque tirage
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. RÉALISATIONS – GALLERY MOTION (Reveal effect, Zoom on hover, Fluid transitions) */}
      <section className="px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4" id="gallery-motion-section">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-1.5 rounded-full bg-[#00b4d8]" />
                <span className="w-5 h-1.5 rounded-full bg-[#e6007e]" />
                <span className="w-4 h-1.5 rounded-full bg-[#ffd000]" />
              </div>
              <h2
                className="text-2xl sm:text-3xl font-black text-[#0b244d] tracking-tight"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                Nos Réalisations Récentes
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Un aperçu de nos projets d'impression, signalétique et packaging sur mesure.
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.03, x: 2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectTab('galerie')}
              id="view-all-portfolio-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-[#0066cc] text-white text-xs font-bold transition-all self-start sm:self-auto cursor-pointer shadow-sm"
            >
              <span>Voir tout le portfolio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          {/* Staggered Portfolio Motion Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {showcaseProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6 }}
                onClick={() => {
                  if (onOpenLightbox) {
                    onOpenLightbox(project);
                  } else {
                    onSelectTab('galerie');
                  }
                }}
                className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-xl hover:shadow-slate-300/50 transition-all cursor-pointer flex flex-col"
              >
                {/* Image Container with Zoom Reveal on Hover */}
                <div className="aspect-4/3 w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-600 ease-out"
                  />
                  {/* Category Pill Tag */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur-xs border border-white/20">
                      {project.category}
                    </span>
                  </div>

                  {/* Hover Reveal Overlay with Action */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white/90 text-slate-950 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300 shadow-lg">
                      <Eye className="w-5 h-5 text-[#0066cc]" />
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#0066cc] transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">
                      {project.client ? project.client.split('(')[0] : 'Client Pro'}
                    </span>
                    <span className="font-bold text-[#0066cc] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Aperçu <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CURVED NAVY BANNER WITH CMYK RIBBONS (Exact Mockup Match) */}
      <section className="px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4" id="bottom-banner-cta">
        <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden bg-[#071936] text-white p-6 sm:p-8 lg:p-10 shadow-xl border border-slate-800">
          {/* Bottom-left CMYK radiating ribbon arcs */}
          <div className="absolute -bottom-12 -left-12 w-64 h-64 pointer-events-none z-0">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              {/* Cyan arc */}
              <path
                d="M 10 190 C 20 120, 80 60, 190 50"
                stroke="#00B4D8"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Magenta arc */}
              <path
                d="M 10 190 C 30 135, 95 75, 190 70"
                stroke="#E6007E"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Yellow arc */}
              <path
                d="M 10 190 C 40 150, 110 90, 190 90"
                stroke="#FFD000"
                strokeWidth="14"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 text-center md:text-left">
            {/* Left Content with Trophy icon */}
            <div className="flex items-center gap-3.5 sm:gap-4 justify-center md:justify-start">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 text-white shadow-inner">
                <Trophy className="w-6 h-6 stroke-[2]" />
              </div>

              <h3
                className="text-base sm:text-lg lg:text-xl font-black text-white tracking-tight"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                BARKA SOLUTIONS S.A.S, la qualité au service de{' '}
                <span className="text-[#ffd000] relative inline-block">
                  votre communication !
                  <svg
                    className="absolute -bottom-1 left-0 w-full h-2 text-[#ffd000]"
                    viewBox="0 0 200 8"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path d="M 0 5 Q 100 8 200 3" stroke="currentColor" strokeWidth="2.5" />
                  </svg>
                </span>
              </h3>
            </div>

            {/* Right Yellow Action Button */}
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onSelectTab('contact')}
              id="bottom-banner-contact-btn"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#ffd000] hover:bg-[#ffc400] text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-500/25 transition-all shrink-0 cursor-pointer"
            >
              <span>Contactez-nous</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
};
