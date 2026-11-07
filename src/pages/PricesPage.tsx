import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PricesScreen } from '../components/PricesScreen';
import { SEOHead } from '../components/SEOHead';
import { TabType } from '../types';
import { tabToPath } from '../utils/navigation';

export const PricesPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSelectTab = (tab: TabType) => {
    navigate(tabToPath(tab));
  };

  const handlePreselectQuoteProduct = (productId: string) => {
    navigate(`/devis?product=${productId}`);
  };

  const pricesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PriceSpecification',
    'name': "Grille tarifaire officielle 2026 - BARKA SOLUTIONS S.A.S",
    'priceCurrency': 'XAF',
    'description':
      "Tarifs indicatifs et transparents d'imprimerie numérique, offset, sérigraphie, papeterie et signalétique à Ngaoundéré, Cameroun.",
  };

  return (
    <>
      <SEOHead
        title="Grille Tarifaire 2026 - Tarifs Imprimerie & Sérigraphie à Ngaoundéré"
        description="Consultez les tarifs officiels et transparents de BARKA SOLUTIONS S.A.S : cartes de visite, flyers, banderoles, sérigraphie textile et grands formats à Ngaoundéré, Cameroun."
        keywords="tarifs imprimerie Ngaoundéré, prix impression numérique Ngaoundéré, prix sérigraphie Ngaoundéré, devis impression Ngaoundéré, BARKA SOLUTIONS"
        jsonLd={pricesJsonLd}
      />
      <PricesScreen
        onBack={() => navigate('/')}
        onSelectTab={handleSelectTab}
        onPreselectQuoteProduct={handlePreselectQuoteProduct}
      />
    </>
  );
};
