import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Navigation,
  CheckCircle2,
  MessageCircle,
  ExternalLink,
  PhoneCall,
  Compass,
} from 'lucide-react';
import { motion } from 'motion/react';
import { COMPANY_SETTINGS } from '../config/companySettings';
import { apiService } from '../services/api';

interface ContactScreenProps {
  onBack: () => void;
}

const MAPS_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=BARKA+SOLUTIONS+S.A.S%2C+Ngaound%C3%A9r%C3%A9%2C+Cameroun';
const MAPS_EMBED_URL = 'https://maps.google.com/maps?q=BARKA+SOLUTIONS+S.A.S,+Ngaoundéré,+Cameroun&t=&z=15&ie=UTF8&iwloc=&output=embed';

export const ContactScreen: React.FC<ContactScreenProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formRenderedAt] = useState(() => Date.now());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSending(true);

    const waText = `Bonjour BARKA SOLUTIONS S.A.S,%0A%0AJe vous contacte depuis la page Contact :%0A- *Nom* : ${encodeURIComponent(name)}%0A- *Contact* : ${encodeURIComponent(email)}%0A- *Message* : ${encodeURIComponent(message)}%0A%0AMerci de me recontacter.`;

    try {
      const res = await apiService.sendContactMessage({
        name,
        emailOrPhone: email,
        message,
        barka_hp_check: honeypot,
        _form_rendered_at: formRenderedAt,
      });

      setIsSending(false);
      if (res.success) {
        setIsSent(true);
        const targetUrl = res.whatsappUrl || `https://wa.me/237696311198?text=${waText}`;
        window.open(targetUrl, '_blank');
      } else {
        setErrorMessage(res.error || 'Une erreur est survenue lors de l’envoi de votre message.');
      }
    } catch {
      setIsSending(false);
      setIsSent(true);
      window.open(`https://wa.me/237696311198?text=${waText}`, '_blank');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8" id="contact-screen-content">
      {/* Top Header Bar with Back Button */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          aria-label="Retour à l'accueil"
          id="contact-back-btn"
          className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 transition-colors border border-slate-200 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Contact & Localisation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            BARKA SOLUTIONS S.A.S — Imprimerie & Multiservices à Ngaoundéré, Cameroun
          </p>
        </div>
      </div>

      {/* 4 ACTIONS MAJEURES : APPELER, WHATSAPP, EMAIL, LOCALISER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* ACTION 1 : APPELER */}
        <motion.a
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="tel:+237696311198"
          id="btn-action-appeler"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white transition-colors shadow-sm hover:shadow-md cursor-pointer text-center group border border-blue-950"
        >
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <PhoneCall className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-black text-xs sm:text-sm tracking-wide">APPELER</span>
          <span className="text-[11px] text-slate-300 font-mono mt-0.5">+237 696 311 198</span>
        </motion.a>

        {/* ACTION 2 : WHATSAPP (ouvre une conversation avec BARKA SOLUTIONS) */}
        <motion.a
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="https://wa.me/237696311198?text=Bonjour%20BARKA%20SOLUTIONS%20S.A.S%2C%20je%20souhaite%20entrer%20en%20contact%20avec%20votre%20atelier."
          target="_blank"
          rel="noopener noreferrer"
          id="btn-action-whatsapp"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white transition-colors shadow-sm hover:shadow-md cursor-pointer text-center group border border-emerald-700"
        >
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xs sm:text-sm tracking-wide">WHATSAPP</span>
          <span className="text-[11px] text-emerald-100 font-mono mt-0.5">+237 696 311 198</span>
        </motion.a>

        {/* ACTION 3 : EMAIL */}
        <motion.a
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="mailto:direction@barkasolutions.org?cc=kouchoumichel@yahoo.fr&subject=Contact%20BARKA%20SOLUTIONS%20S.A.S"
          id="btn-action-email"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-sm hover:shadow-md cursor-pointer text-center group border border-slate-950"
        >
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Mail className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-black text-xs sm:text-sm tracking-wide">EMAIL</span>
          <span className="text-[11px] text-slate-300 truncate max-w-[140px] mt-0.5">direction@barkasolutions.org</span>
        </motion.a>

        {/* ACTION 4 : LOCALISER (Recherche Google Maps BARKA SOLUTIONS S.A.S, Ngaoundéré, Cameroun) */}
        <motion.a
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href={MAPS_SEARCH_URL}
          target="_blank"
          rel="noopener noreferrer"
          id="btn-action-localiser"
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-sm hover:shadow-md cursor-pointer text-center group border border-amber-600"
        >
          <div className="w-11 h-11 rounded-xl bg-slate-950/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Navigation className="w-5 h-5 text-slate-950" />
          </div>
          <span className="font-black text-xs sm:text-sm tracking-wide">LOCALISER</span>
          <span className="text-[11px] text-slate-900 font-semibold mt-0.5">Google Maps</span>
        </motion.a>
      </div>

      {/* Main Grid: Coordonnées Officielles + Carte & Accès */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Carte 1 : Coordonnées Officielles */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 inline-block mb-1">
                Informations Officielles
              </span>
              <h2 className="text-lg font-black text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                BARKA SOLUTIONS S.A.S
              </h2>
              <p className="text-xs text-slate-500 font-medium">Société par Actions Simplifiée</p>
            </div>

            {/* Adresse */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Adresse & Situation
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
                  Derrière le Restaurant Le Verger
                </p>
                <p className="text-xs font-semibold text-slate-600">Ngaoundéré, Cameroun</p>
              </div>
            </div>

            {/* Téléphones */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Lignes Téléphoniques Directes
                </span>
                <div className="flex flex-col gap-1.5 mt-1">
                  <a
                    href="tel:+237696311198"
                    className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-900 transition-colors flex items-center gap-2"
                  >
                    <span>+237 696 311 198</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">Appels & WhatsApp</span>
                  </a>
                  <a
                    href="tel:+237690084142"
                    className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-900 transition-colors flex items-center gap-2"
                  >
                    <span>+237 690 084 142</span>
                    <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded font-semibold">Ligne secondaire</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Emails */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Adresses Email Officielles
                </span>
                <div className="flex flex-col gap-1.5 mt-1">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href="mailto:kouchoumichel@yahoo.fr"
                      className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-blue-900 transition-colors truncate"
                    >
                      kouchoumichel@yahoo.fr
                    </a>
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=kouchoumichel@yahoo.fr&su=Contact%20BARKA%20SOLUTIONS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 transition shrink-0"
                      title="Ouvrir dans Gmail"
                    >
                      Gmail Web
                    </a>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href="mailto:direction@barkasolutions.org"
                      className="text-xs sm:text-sm font-semibold text-slate-800 hover:text-blue-900 transition-colors truncate"
                    >
                      direction@barkasolutions.org
                    </a>
                    <a
                      href="https://mail.google.com/mail/?view=cm&fs=1&to=direction@barkasolutions.org&cc=kouchoumichel@yahoo.fr&su=Demande%20BARKA%20SOLUTIONS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200 transition shrink-0"
                      title="Ouvrir dans Gmail"
                    >
                      Gmail Web
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Horaires */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Horaires d'Ouverture de l'Atelier
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">
                  {COMPANY_SETTINGS.opening_hours.weekday}
                </p>
                <p className="text-xs text-slate-500">
                  {COMPANY_SETTINGS.opening_hours.saturday}
                </p>
                <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                  {COMPANY_SETTINGS.opening_hours.sunday}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Carte 2 : Localisation Google Maps & Accès */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between" id="map-section">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Localisation de BARKA SOLUTIONS
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Ngaoundéré</span>
            </div>

            {/* Carte dynamique Google Maps intégrant la recherche BARKA SOLUTIONS S.A.S */}
            <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden bg-slate-100 border border-slate-300 shadow-inner">
              <iframe
                title="Localisation BARKA SOLUTIONS S.A.S Ngaoundéré"
                src={MAPS_EMBED_URL}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              
              {/* Badge indicatif sans coordonnées arbitraires */}
              <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg border border-slate-700 text-[10px] font-bold flex items-center gap-1.5 shadow-md pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>BARKA SOLUTIONS S.A.S</span>
              </div>

              <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-800 shadow-xs pointer-events-none">
                📍 Derrière le Restaurant Le Verger, Ngaoundéré
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
              La recherche Google Maps est configurée sur <strong className="text-slate-700">BARKA SOLUTIONS S.A.S, Ngaoundéré, Cameroun</strong> pour vous orienter directement vers notre atelier sans pointer uniquement sur le restaurant.
            </p>
          </div>

          {/* Bouton d'action LOCALISER complet */}
          <motion.a
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.98 }}
            href={MAPS_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="btn-nous-localiser-full"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide transition-colors shadow-sm cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-slate-950" />
            <span>OUVRIR DANS GOOGLE MAPS (BARKA SOLUTIONS S.A.S)</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-800" />
          </motion.a>
        </div>
      </div>

      {/* Formulaire de Contact Direct */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Envoyez-nous un Message
          </h3>
          <p className="text-xs text-slate-500">
            Renseignez votre besoin ou question ci-dessous. Nous vous répondrons directement par email ou sur WhatsApp.
          </p>
        </div>

        {isSent ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-base font-bold">Votre message a bien été envoyé !</p>
            <p className="text-xs text-emerald-700">L'équipe BARKA SOLUTIONS S.A.S à Ngaoundéré vous répondra dans les plus brefs délais.</p>
            <button
              onClick={() => {
                setIsSent(false);
                setName('');
                setEmail('');
                setMessage('');
              }}
              className="text-xs font-bold text-emerald-900 underline mt-3 cursor-pointer inline-block"
            >
              Envoyer un autre message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-4">
            {/* Honeypot invisible */}
            <div
              style={{
                position: 'absolute',
                opacity: 0,
                zIndex: -1,
                pointerEvents: 'none',
                height: 0,
                width: 0,
                overflow: 'hidden',
              }}
              aria-hidden="true"
            >
              <label htmlFor="barka_hp_contact_check">Ne pas renseigner ce champ</label>
              <input
                id="barka_hp_contact_check"
                type="text"
                name="barka_hp_check"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Votre Nom & Prénom *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Hamidou Bouba"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:bg-white focus:outline-hidden text-xs sm:text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone ou Email *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: +237 696 311 198 / email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:bg-white focus:outline-hidden text-xs sm:text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Votre Message ou Projet *</label>
              <textarea
                required
                rows={4}
                placeholder="Décrivez votre besoin d'impression, signalétique, sérigraphie, papeterie ou multiservices..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-900 focus:bg-white focus:outline-hidden text-xs sm:text-sm"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.015, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSending}
              id="contact-btn-nous-ecrire"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
            >
              {isSending ? (
                <span>Transmission en cours...</span>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-400" />
                  <span>ENVOYER MON MESSAGE</span>
                </>
              )}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  );
};
