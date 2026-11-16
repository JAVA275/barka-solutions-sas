import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PortfolioScreen } from '../components/PortfolioScreen';
import { LightboxModal } from '../components/LightboxModal';
import { SEOHead } from '../components/SEOHead';
import { PortfolioItem, TabType } from '../types';
import { PORTFOLIO_DATA, SERVICES_DATA } from '../data/mockData';
import { apiService } from '../services/api';
import { tabToPath } from '../utils/navigation';

export const PortfolioPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(() => {
    try {
      const localStored = localStorage.getItem('barka_portfolio_custom_items');
      if (localStored) {
        const clientPortfolio = JSON.parse(localStored);
        if (Array.isArray(clientPortfolio) && clientPortfolio.length > 0) {
          const validCustom = clientPortfolio.filter((i) => i && i.id && i.active !== false);
          const customIds = new Set(validCustom.map((i) => i.id));
          return [...validCustom, ...PORTFOLIO_DATA.filter((p) => !customIds.has(p.id))];
        }
      }
    } catch {
      // ignore
    }
    return PORTFOLIO_DATA;
  });
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  // Load portfolio items
  useEffect(() => {
    let isMounted = true;
    const loadPortfolio = async () => {
      try {
        const res = await apiService.getPortfolio();
        let baseItems: PortfolioItem[] = [];
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          baseItems = [...res.data];
        } else {
          baseItems = [...PORTFOLIO_DATA];
        }
        try {
          const localStored = localStorage.getItem('barka_portfolio_custom_items');
          if (localStored) {
            const clientPortfolio = JSON.parse(localStored);
            if (Array.isArray(clientPortfolio)) {
              const currentIds = new Set(baseItems.map((p) => p.id));
              for (const cp of clientPortfolio) {
                if (cp && cp.id && cp.active !== false && !currentIds.has(cp.id)) {
                  baseItems.unshift(cp);
                }
              }
            }
          }
        } catch {
          // ignore
        }
        if (isMounted) {
          setPortfolioItems(baseItems);
        }
      } catch {
        let fallback = [...PORTFOLIO_DATA];
        try {
          const localStored = localStorage.getItem('barka_portfolio_custom_items');
          if (localStored) {
            const clientPortfolio = JSON.parse(localStored);
            if (Array.isArray(clientPortfolio)) {
              const currentIds = new Set(fallback.map((p) => p.id));
              for (const cp of clientPortfolio) {
                if (cp && cp.id && cp.active !== false && !currentIds.has(cp.id)) {
                  fallback.unshift(cp);
                }
              }
            }
          }
        } catch {
          // ignore
        }
        if (isMounted) {
          setPortfolioItems(fallback);
        }
      }
    };
    loadPortfolio();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize lightbox with URL parameter :id
  useEffect(() => {
    if (id && portfolioItems.length > 0) {
      const match = portfolioItems.find((item) => String(item.id) === String(id));
      if (match) {
        setSelectedItem(match);
      }
    } else if (!id) {
      setSelectedItem(null);
    }
  }, [id, portfolioItems]);

  const handleOpenLightbox = (item: PortfolioItem) => {
    navigate(`/portfolio/${item.id}`);
  };

  const handleCloseLightbox = () => {
    navigate('/portfolio');
  };

  const handleRequestQuote = (item: PortfolioItem) => {
    const matchedService = SERVICES_DATA.find(
      (s) => s.category.toLowerCase().includes(item.category.toLowerCase()) || s.id === item.category.toLowerCase()
    );
    if (matchedService) {
      navigate(`/devis?product=${matchedService.id}`);
    } else {
      navigate('/devis');
    }
  };

  const handleSelectTab = (tab: TabType) => {
    navigate(tabToPath(tab));
  };

  const pageTitle = selectedItem
    ? `${selectedItem.title} - Réalisation d'Imprimerie à Ngaoundéré`
    : "Portfolio & Réalisations d'Imprimerie et Signalétique à Ngaoundéré";

  const pageDescription = selectedItem
    ? `Découvrez la réalisation "${selectedItem.title}" (${selectedItem.category}) produite par l'atelier d'imprimerie BARKA SOLUTIONS S.A.S à Ngaoundéré.`
    : "Galerie de nos réalisations d'imprimerie offset, sérigraphie textile, impression grand format, signalétique et conception graphique à Ngaoundéré, Cameroun.";

  const portfolioJsonLd = selectedItem
    ? {
        '@context': 'https://schema.org',
        '@type': 'VisualArtwork',
        'name': selectedItem.title,
        'creator': {
          '@type': 'LocalBusiness',
          'name': 'BARKA SOLUTIONS S.A.S',
        },
        'artMedium': selectedItem.category,
        'image': selectedItem.image,
        'description': selectedItem.description || selectedItem.title,
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'ImageGallery',
        'name': 'Galerie des réalisations de BARKA SOLUTIONS S.A.S',
        'description': "Portfolio d'impressions grand format, sérigraphie, papeterie et signalétique à Ngaoundéré.",
        'image': portfolioItems.slice(0, 8).map((p) => p.image),
      };

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords="portfolio imprimerie Ngaoundéré, réalisations sérigraphie Ngaoundéré, impression grand format Ngaoundéré, signalétique Ngaoundéré, BARKA SOLUTIONS"
        ogImage={selectedItem?.image}
        jsonLd={portfolioJsonLd}
      />

      <PortfolioScreen
        initialItems={portfolioItems}
        onBack={() => navigate('/')}
        onOpenLightbox={handleOpenLightbox}
        onSelectTab={handleSelectTab}
      />

      <LightboxModal
        item={selectedItem}
        onClose={handleCloseLightbox}
        onRequestQuote={handleRequestQuote}
      />
    </>
  );
};
