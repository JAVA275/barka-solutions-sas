import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeScreen } from '../components/HomeScreen';
import { SEOHead } from '../components/SEOHead';
import { PortfolioItem, TabType } from '../types';
import { tabToPath } from '../utils/navigation';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectTab = (tab: TabType) => {
    navigate(tabToPath(tab));
  };

  const handleOpenLightbox = (item: PortfolioItem) => {
    navigate(`/portfolio/${item.id}`);
  };

  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'BARKA SOLUTIONS S.A.S',
    'url': 'https://barkasolutions.org',
    'description':
      'Imprimerie et communication visuelle à Ngaoundéré : impression numérique, impression offset, sérigraphie, impression grand format, conception graphique et signalétique.',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://barkasolutions.org/services?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <SEOHead
        title="Imprimerie, Sérigraphie & Communication Visuelle à Ngaoundéré"
        description="BARKA SOLUTIONS S.A.S, imprimerie à Ngaoundéré : impression numérique, impression offset, sérigraphie, impression grand format, signalétique et conception graphique au Cameroun."
        keywords="BARKA SOLUTIONS, imprimerie Ngaoundéré, impression numérique Ngaoundéré, impression offset Ngaoundéré, sérigraphie Ngaoundéré, impression grand format Ngaoundéré, conception graphique Ngaoundéré, signalétique Ngaoundéré, Cameroun"
        jsonLd={homeJsonLd}
      />
      <HomeScreen
        onSelectTab={handleSelectTab}
        onOpenLightbox={handleOpenLightbox}
      />
    </>
  );
};
