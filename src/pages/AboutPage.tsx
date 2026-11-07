import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AboutScreen } from '../components/AboutScreen';
import { SEOHead } from '../components/SEOHead';
import { TabType } from '../types';
import { tabToPath } from '../utils/navigation';

export const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectTab = (tab: TabType) => {
    navigate(tabToPath(tab));
  };

  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    'name': 'À Propos de BARKA SOLUTIONS S.A.S - Imprimerie à Ngaoundéré',
    'description':
      "Société par Actions Simplifiée (S.A.S) leader en imprimerie moderne, offset, sérigraphie, conception graphique, BTP et multiservices à Ngaoundéré, Région de l'Adamaoua, Cameroun.",
    'mainEntity': {
      '@type': 'Organization',
      'name': 'BARKA SOLUTIONS S.A.S',
      'legalName': 'BARKA SOLUTIONS Société par Actions Simplifiée',
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
        title="À Propos de la Société BARKA SOLUTIONS S.A.S à Ngaoundéré"
        description="Découvrez l'histoire, la vision d'excellence et les engagements de BARKA SOLUTIONS S.A.S, votre imprimerie et partenaire multiservices à Ngaoundéré, Cameroun."
        keywords="société BARKA SOLUTIONS, imprimerie Ngaoundéré, entreprise impression Adamaoua, imprimerie moderne Cameroun"
        jsonLd={aboutJsonLd}
      />
      <AboutScreen
        onBack={() => navigate('/')}
        onSelectTab={handleSelectTab}
      />
    </>
  );
};
