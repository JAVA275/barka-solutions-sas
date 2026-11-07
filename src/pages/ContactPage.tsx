import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ContactScreen } from '../components/ContactScreen';
import { SEOHead } from '../components/SEOHead';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  const contactJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    'name': 'Contact & Atelier - BARKA SOLUTIONS S.A.S',
    'description':
      "Contactez l'atelier BARKA SOLUTIONS S.A.S à Ngaoundéré : téléphone, WhatsApp, email et localisation derrière le Restaurant Le Verger.",
    'mainEntity': {
      '@type': 'LocalBusiness',
      'name': 'BARKA SOLUTIONS S.A.S',
      'telephone': ['+237 696 311 198', '+237 690 084 142'],
      'email': ['kouchoumichel@yahoo.fr', 'direction@barkasolutions.org'],
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'Derrière le Restaurant Le Verger',
        'addressLocality': 'Ngaoundéré',
        'addressRegion': 'Adamaoua',
        'addressCountry': 'CM',
      },
    },
  };

  return (
    <>
      <SEOHead
        title="Contact & Localisation de l'Atelier d'Imprimerie à Ngaoundéré"
        description="Contactez BARKA SOLUTIONS S.A.S à Ngaoundéré (Derrière le Restaurant Le Verger) : +237 696 311 198. Imprimerie, sérigraphie, conception graphique et signalétique."
        keywords="contact imprimerie Ngaoundéré, adresse imprimerie Ngaoundéré, téléphone BARKA SOLUTIONS, imprimerie Adamaoua, Cameroun"
        jsonLd={contactJsonLd}
      />
      <ContactScreen
        onBack={() => navigate('/')}
      />
    </>
  );
};
