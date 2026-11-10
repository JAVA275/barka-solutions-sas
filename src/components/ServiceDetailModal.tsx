import React from 'react';
import { X, CheckCircle, FileText, Sparkles, MessageCircle } from 'lucide-react';
import { ServiceItem } from '../types';
import { COMPANY_INFO } from '../data/mockData';

interface ServiceDetailModalProps {
  service: ServiceItem | null;
  onClose: () => void;
  onOrderQuote: (serviceId: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  onClose,
  onOrderQuote,
}) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" id="service-detail-modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl z-10 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Cover Image Header */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-900 overflow-hidden">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 text-white hover:bg-orange-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 bg-orange-500/20 px-2.5 py-0.5 rounded-full border border-orange-500/30">
              {service.category}
            </span>
            <h2
              className="text-xl sm:text-2xl font-extrabold mt-1"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {service.title}
            </h2>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Description de la prestation
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {service.fullDesc}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>Options & Capacités disponibles</span>
            </h4>
            <div className="space-y-2">
              {service.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => {
                onClose();
                onOrderQuote(service.id);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Passer une commande personnalisée</span>
            </button>

            <a
              href={`https://wa.me/${(COMPANY_INFO.whatsapp_raw || COMPANY_INFO.whatsapp || '237696311198').replace(/\D/g, '')}?text=Bonjour%20BARKA%20SOLUTIONS%2C%20je%20souhaite%20des%20informations%20sur%20le%20service%20${encodeURIComponent(service.title)}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
