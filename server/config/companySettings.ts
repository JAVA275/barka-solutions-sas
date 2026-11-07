import { CompanySettings } from '../types';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  company_name: 'BARKA SOLUTIONS S.A.S',
  legal_name: 'BARKA SOLUTIONS Société par Actions Simplifiée (S.A.S)',
  tagline: 'Imprimerie & Multiservices',
  slogan: "L'excellence maîtrisée",
  address: 'Derrière le Restaurant Le Verger, Ngaoundéré, Cameroun',
  city: 'Ngaoundéré',
  country: 'Cameroun',
  phone_primary: '+237 696 311 198',
  phone_secondary: '+237 690 084 142',
  whatsapp: '+237 696 311 198',
  whatsapp_raw: '237696311198',
  email_primary: 'kouchoumichel@yahoo.fr',
  email_secondary: 'direction@barkasolutions.org',
  website: '',
  logo: '/assets/logo-barka.png',
  opening_hours: {
    weekday: 'Lundi - Vendredi : 08h00 – 18h00',
    saturday: 'Samedi : 08h00 – 13h00',
    sunday: 'Fermé (Permanence WhatsApp 24/7)',
  },
  social_links: {
    whatsapp: 'https://wa.me/237696311198',
    email: 'mailto:direction@barkasolutions.org',
  },
};
