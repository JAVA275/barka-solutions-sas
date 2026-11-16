import React from 'react';
import { Phone, Mail, MapPin, MessageCircle, Heart, Facebook, Youtube, Linkedin } from 'lucide-react';
import { BarkaLogo } from './BarkaLogo';
import { TabType, CompanySettings } from '../types';
import { COMPANY_INFO } from '../data/mockData';

interface FooterProps {
  onSelectTab: (tab: TabType) => void;
  companySettings?: CompanySettings;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab, companySettings }) => {
  const activeCompany = companySettings || (() => {
    try {
      const stored = localStorage.getItem('barka_company_settings');
      if (stored) return { ...COMPANY_INFO, ...JSON.parse(stored) };
    } catch {
      // ignore
    }
    return COMPANY_INFO;
  })();

  const facebookUrl = activeCompany.social_links?.facebook || activeCompany.social_facebook || 'https://facebook.com';
  const youtubeUrl = activeCompany.social_links?.youtube || activeCompany.social_youtube || 'https://youtube.com';
  const linkedinUrl = activeCompany.social_links?.linkedin || activeCompany.social_linkedin || 'https://linkedin.com';
  const phone1 = activeCompany.phone_primary || activeCompany.phone1 || '+237 696 311 198';
  const phone2 = activeCompany.phone_secondary || activeCompany.phone2 || '+237 690 084 142';
  const email1 = activeCompany.email_primary || activeCompany.email1 || 'kouchoumichel@yahoo.fr';
  const email2 = activeCompany.email_secondary || activeCompany.email2 || 'direction@barkasolutions.org';
  const address = activeCompany.address || COMPANY_INFO.address;
  const whatsappNum = (activeCompany.whatsapp_raw || activeCompany.whatsapp || '237696311198').replace(/\D/g, '');

  return (
    <footer className="bg-slate-950 text-white pt-10 sm:pt-12 pb-24 sm:pb-8 border-t border-slate-800" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: Identity */}
          <div className="space-y-4">
            <BarkaLogo variant="dark" size="md" />
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Société par Actions Simplifiée spécialisée en imprimerie numérique, impression offset,
              sérigraphie, grand format, signalétique, communication visuelle, conception graphique,
              branding, informatique, BTP, commerce général et prestations multiservices à Ngaoundéré, Cameroun.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Atelier ouvert & opérationnel</span>
            </div>
          </div>

          {/* Col 2: Activités */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Nos Activités
            </h4>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-300">
              {[
                'Imprimerie numérique & offset',
                'Sérigraphie & Grand format',
                'Signalétique & Communication visuelle',
                'Conception graphique & Branding',
                'Informatique & BTP',
                'Commerce général & Multiservices',
              ].map((s, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => onSelectTab('services')}
                    className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              {[
                { id: 'accueil', label: 'Accueil' },
                { id: 'services', label: 'Nos services' },
                { id: 'tarifs', label: 'Grille tarifaire' },
                { id: 'galerie', label: 'Nos Réalisations' },
                { id: 'devis', label: 'Passer une commande' },
                { id: 'apropos', label: 'À propos' },
                { id: 'contact', label: 'Contactez-nous' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => onSelectTab(link.id as TabType)}
                    className="hover:text-orange-400 transition-colors text-left cursor-pointer"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Coordonnées Ngaoundéré */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">
              Coordonnées
            </h4>
            <div className="space-y-2 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>{address}</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <a href={`tel:${phone1.replace(/\s+/g, '')}`} className="hover:text-orange-400">
                    {phone1}
                  </a>
                  {phone2 && (
                    <a href={`tel:${phone2.replace(/\s+/g, '')}`} className="hover:text-orange-400">
                      {phone2}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <a href={`mailto:${email1}`} className="hover:text-orange-400 truncate">
                    {email1}
                  </a>
                  {email2 && (
                    <a href={`mailto:${email2}`} className="hover:text-orange-400 truncate">
                      {email2}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <a
                href={`https://wa.me/${whatsappNum}?text=Bonjour%20BARKA%20SOLUTIONS%2C%20je%20souhaite%20des%20informations.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors w-fit"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp : {phone1}</span>
              </a>

              {/* Social Media Links */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400 font-semibold mr-1">Suivez-nous :</span>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Page Facebook officielle"
                  className="w-7 h-7 rounded-full bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors flex items-center justify-center text-xs border border-slate-800"
                >
                  <Facebook className="w-3.5 h-3.5 fill-current" />
                </a>
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  title="Chaîne YouTube officielle"
                  className="w-7 h-7 rounded-full bg-slate-900 hover:bg-red-600 text-slate-300 hover:text-white transition-colors flex items-center justify-center text-xs border border-slate-800"
                >
                  <Youtube className="w-3.5 h-3.5 fill-current" />
                </a>
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  title="Page LinkedIn officielle"
                  className="w-7 h-7 rounded-full bg-slate-900 hover:bg-blue-500 text-slate-300 hover:text-white transition-colors flex items-center justify-center text-xs border border-slate-800"
                >
                  <Linkedin className="w-3.5 h-3.5 fill-current" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 BARKA SOLUTIONS S.A.S — Tous droits réservés. Ngaoundéré, Cameroun.</p>
          <p className="flex items-center gap-1">
            Conçu avec excellence pour l'impression et les solutions professionnelles
          </p>
        </div>
      </div>
    </footer>
  );
};
