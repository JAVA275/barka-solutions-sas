import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { QuoteScreen } from '../components/QuoteScreen';
import { SEOHead } from '../components/SEOHead';
import { SubmittedQuote, TabType } from '../types';
import { tabToPath } from '../utils/navigation';

interface QuotePageProps {
  onQuoteSubmitted?: (quote: SubmittedQuote) => void;
}

export const QuotePage: React.FC<QuotePageProps> = ({ onQuoteSubmitted }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const productFromQuery = searchParams.get('product');
  const productFromState = (location.state as { product?: string } | null)?.product;
  const preselectedProduct = productFromQuery || productFromState || 'cartes-visite';

  const handleSelectTab = (tab: TabType) => {
    navigate(tabToPath(tab));
  };

  const quoteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    'name': "Commande en Ligne Directe & Devis - BARKA SOLUTIONS S.A.S",
    'description':
      "Commandez en direct vos travaux d'imprimerie, sérigraphie ou signalétique en quelques clics à Ngaoundéré, Cameroun.",
  };

  return (
    <>
      <SEOHead
        title="Commande en Ligne Directe d'Imprimerie & Sérigraphie à Ngaoundéré"
        description="Passez votre commande en ligne directe et instantanée pour vos impressions numériques, offset, sérigraphie, grands formats et signalétique avec BARKA SOLUTIONS S.A.S à Ngaoundéré."
        keywords="commande imprimerie Ngaoundéré, devis imprimerie Ngaoundéré, estimation prix impression Ngaoundéré, sérigraphie Ngaoundéré, grand format Ngaoundéré, BARKA SOLUTIONS"
        jsonLd={quoteJsonLd}
      />
      <QuoteScreen
        onBack={() => navigate('/')}
        preselectedProduct={preselectedProduct}
        onQuoteSubmitted={onQuoteSubmitted}
        onSelectTab={handleSelectTab}
      />
    </>
  );
};
