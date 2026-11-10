import { QuoteStatus } from '../types';

export interface QuoteStatusInfo {
  key: QuoteStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  description: string;
  stepNumber: number;
}

export const OFFICIAL_QUOTE_STATUSES: QuoteStatus[] = [
  'NOUVEAU',
  'EN_ANALYSE',
  'DEVIS_EN_PREPARATION',
  'DEVIS_ENVOYE',
  'EN_ATTENTE_CLIENT',
  'ACCEPTE',
  'EN_PRODUCTION',
  'TERMINE',
  'ANNULE',
];

export const QUOTE_STATUS_CONFIG: Record<string, QuoteStatusInfo> = {
  NOUVEAU: {
    key: 'NOUVEAU',
    label: 'Nouvelle commande',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Commande enregistrée, en attente de prise en charge par l’atelier.',
    stepNumber: 1,
  },
  EN_ANALYSE: {
    key: 'EN_ANALYSE',
    label: 'Commande en analyse',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-200',
    dotColor: 'bg-sky-500',
    description: 'Fichiers graphiques et spécifications techniques en cours d’examen.',
    stepNumber: 2,
  },
  DEVIS_EN_PREPARATION: {
    key: 'DEVIS_EN_PREPARATION',
    label: 'Commande en préparation',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    dotColor: 'bg-indigo-500',
    description: 'Calibration des consommables et chiffrage technique.',
    stepNumber: 3,
  },
  DEVIS_ENVOYE: {
    key: 'DEVIS_ENVOYE',
    label: 'Commande envoyée',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    dotColor: 'bg-purple-500',
    description: 'Confirmation et récapitulatif transmis au client par WhatsApp/Email.',
    stepNumber: 4,
  },
  EN_ATTENTE_CLIENT: {
    key: 'EN_ATTENTE_CLIENT',
    label: 'En attente client',
    badgeBg: 'bg-orange-50',
    badgeText: 'text-orange-800',
    badgeBorder: 'border-orange-200',
    dotColor: 'bg-orange-500',
    description: 'En attente du Bon à Tirer (BAT) ou de la validation client.',
    stepNumber: 5,
  },
  ACCEPTE: {
    key: 'ACCEPTE',
    label: 'Commande acceptée',
    badgeBg: 'bg-teal-50',
    badgeText: 'text-teal-800',
    badgeBorder: 'border-teal-200',
    dotColor: 'bg-teal-500',
    description: 'Commande et Bon à Tirer (BAT) validés, production confirmée.',
    stepNumber: 6,
  },
  EN_PRODUCTION: {
    key: 'EN_PRODUCTION',
    label: 'En production',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-600',
    description: 'Tirage en cours dans les ateliers BARKA (Offset, Numérique, Sérigraphie).',
    stepNumber: 7,
  },
  TERMINE: {
    key: 'TERMINE',
    label: 'Terminée / Livrée',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    description: 'Commande imprimée, façonnée et prête pour retrait ou expédiée.',
    stepNumber: 8,
  },
  ANNULE: {
    key: 'ANNULE',
    label: 'Annulée',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    dotColor: 'bg-rose-500',
    description: 'Commande clôturée sans suite.',
    stepNumber: 0,
  },

  // Backward compatibility normalization
  Nouveau: {
    key: 'NOUVEAU',
    label: 'Nouveau',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    dotColor: 'bg-amber-500',
    description: 'Demande enregistrée, en attente de prise en charge.',
    stepNumber: 1,
  },
  'En cours': {
    key: 'EN_PRODUCTION',
    label: 'En cours',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    dotColor: 'bg-blue-600',
    description: 'En cours de traitement.',
    stepNumber: 7,
  },
  Traité: {
    key: 'TERMINE',
    label: 'Traité',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    dotColor: 'bg-emerald-500',
    description: 'Commande finalisée.',
    stepNumber: 8,
  },
  Archivé: {
    key: 'TERMINE',
    label: 'Archivé',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    dotColor: 'bg-slate-400',
    description: 'Dossier archivé.',
    stepNumber: 9,
  },
};

export function getQuoteStatusInfo(status: QuoteStatus | string): QuoteStatusInfo {
  return (
    QUOTE_STATUS_CONFIG[status] || {
      key: status as QuoteStatus,
      label: status,
      badgeBg: 'bg-slate-50',
      badgeText: 'text-slate-700',
      badgeBorder: 'border-slate-200',
      dotColor: 'bg-slate-400',
      description: '',
      stepNumber: 1,
    }
  );
}
