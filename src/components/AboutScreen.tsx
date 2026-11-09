import React from 'react';
import {
  ArrowLeft,
  Award,
  Users,
  MapPin,
  CheckCircle,
  FileText,
  Target,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType } from '../types';
import { COMPANY_INFO } from '../data/mockData';

interface AboutScreenProps {
  onBack: () => void;
  onSelectTab: (tab: TabType) => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack, onSelectTab }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-8" id="about-screen-content">
      {/* Top Header Bar */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          whileHover={{ scale: 1.05 }}
          onClick={onBack}
          aria-label="Retour à l'accueil"
          className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            À propos de BARKA SOLUTIONS S.A.S
          </h1>
        </div>
      </div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Excellence Industrielle & Créative à Ngaoundéré</span>
        </div>

        <h2 className="text-xl sm:text-3xl font-extrabold leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Votre partenaire d'excellence en impression, branding et solutions professionnelles au Cameroun
        </h2>

        <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
          Implantée au cœur de Ngaoundéré (derrière le Restaurant Le Verger),{' '}
          <strong>BARKA SOLUTIONS S.A.S</strong> est une Société par Actions Simplifiée spécialisée
          dans les travaux d’imprimerie numérique et offset, la signalétique d’envergure, le branding,
          l’informatique, le BTP et les prestations multiservices.
        </p>

        <div className="pt-2 flex flex-wrap gap-4 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <span>Ngaoundéré, Région de l'Adamaoua</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-orange-400" />
            <span>Capacité de production grand tirage</span>
          </div>
        </div>
      </motion.div>

      {/* Nos Engagements & Piliers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Target,
            title: 'Notre Mission',
            desc: "Offrir aux entreprises, administrations, ONG et particuliers des solutions de communication visuelle et de papeterie d’un niveau d'exigence irréprochable avec des délais records.",
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
          {
            icon: Award,
            title: 'Notre Savoir-faire',
            desc: 'Un parc machines moderne combinant presses numériques couleur, traceurs grand format haute résolution, machines de sérigraphie et ateliers de façonnage & reliure.',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            icon: Users,
            title: 'Notre Équipe',
            desc: 'Des graphistes expérimentés, des conducteurs de machines offset/numériques qualifiés et des poseurs de signalétique dédiés à la réussite de chacun de vos projets.',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3 cursor-default"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center font-black text-xl`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Activités Principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4"
      >
        <h3 className="text-lg sm:text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Nos 12 domaines d'activités & compétences
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs sm:text-sm text-slate-700">
          {[
            'Imprimerie numérique',
            'Impression offset',
            'Sérigraphie',
            'Impression grand format',
            'Signalétique',
            'Communication visuelle',
            'Conception graphique',
            'Branding',
            'Informatique',
            'BTP',
            'Commerce général',
            'Prestations multiservices',
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02, x: 2 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-default"
            >
              <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="font-semibold text-slate-800">{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div>
          <h4 className="text-lg font-bold">Besoin d'un accompagnement personnalisé ?</h4>
          <p className="text-xs text-slate-300 mt-1">
            Venez nous rendre visite à notre atelier à Ngaoundéré ou contactez notre direction.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectTab('devis')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors shadow-md shrink-0 cursor-pointer min-h-[44px]"
        >
          <FileText className="w-4 h-4" />
          <span>Passer une commande</span>
        </motion.button>
      </motion.div>
    </div>
  );
};
