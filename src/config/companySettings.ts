import { CompanySettings } from '../types';

export const COMPANY_SETTINGS: CompanySettings = {
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
  hero_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=85',
  hero_publications: [],
  opening_hours: {
    weekday: 'Lundi - Vendredi : 08h00 – 18h00',
    saturday: 'Samedi : 08h00 – 13h00',
    sunday: 'Fermé (Permanence WhatsApp 24/7)',
  },
  social_links: {
    whatsapp: 'https://wa.me/237696311198',
    facebook: 'https://facebook.com',
    linkedin: 'https://linkedin.com',
    youtube: 'https://youtube.com',
    email: 'mailto:direction@barkasolutions.org',
  },
  social_facebook: 'https://facebook.com',
  social_linkedin: 'https://linkedin.com',
  social_youtube: 'https://youtube.com',
  social_whatsapp: 'https://wa.me/237696311198',

  // Backward compatibility alias mappings
  name: 'BARKA SOLUTIONS S.A.S',
  legalForm: 'Société par Actions Simplifiée (S.A.S)',
  phone1: '+237 696 311 198',
  phone2: '+237 690 084 142',
  email1: 'kouchoumichel@yahoo.fr',
  email2: 'direction@barkasolutions.org',
  hoursWeekday: 'Lundi - Vendredi : 08h00 – 18h00',
  hoursSaturday: 'Samedi : 08h00 – 13h00',
  hoursSunday: 'Fermé (Permanence WhatsApp 24/7)',
};

// Backward compatibility export
export const COMPANY_INFO = COMPANY_SETTINGS;
