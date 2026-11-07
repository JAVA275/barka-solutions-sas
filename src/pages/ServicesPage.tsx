import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ServicesScreen } from '../components/ServicesScreen';
import { ServiceDetailModal } from '../components/ServiceDetailModal';
import { SEOHead } from '../components/SEOHead';
import { ServiceItem, TabType } from '../types';
import { SERVICES_DATA } from '../data/mockData';
import { apiService } from '../services/api';
import { tabToPath } from '../utils/navigation';

export const ServicesPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [services, setServices] = useState<ServiceItem[]>(SERVICES_DATA);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Load available services
  useEffect(() => {
    let isMounted = true;
    const loadServices = async () => {
      try {
        const remote = await apiService.getServices(false);
        if (isMounted && remote && remote.length > 0) {
          setServices(remote);
        }
      } catch {
        // Fallback already in place
      }
    };
    loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  // Synchronize modal state with URL parameter :id
  useEffect(() => {
    if (id) {
      const match = services.find((s) => s.id === id || s.id.toLowerCase() === id.toLowerCase());
      if (match) {
        setSelectedService(match);
      } else {
        // Search in default static catalog if remote hadn't finished
        const fallbackMatch = SERVICES_DATA.find((s) => s.id === id || s.id.toLowerCase() === id.toLowerCase());
        setSelectedService(fallbackMatch || null);
      }
    } else {
      setSelectedService(null);
    }
  }, [id, services]);

  const handleSelectService = (service: ServiceItem) => {
    navigate(`/services/${service.id}`);
  };

  const handleCloseModal = () => {
    navigate('/services');
  };

  const handleOrderQuote = (serviceId: string) => {
    navigate(`/devis?product=${serviceId}`);
  };

  const handleSelectTab = (tab: TabType) => {
    navigate(tabToPath(tab));
  };

  // SEO dynamic attributes
  const pageTitle = selectedService
    ? `${selectedService.title} à Ngaoundéré`
    : "Services d'Imprimerie, Sérigraphie & Communication à Ngaoundéré";

  const pageDescription = selectedService
    ? `${selectedService.title} par BARKA SOLUTIONS S.A.S à Ngaoundéré : ${selectedService.shortDesc} ${selectedService.features?.slice(0, 2).join('. ')}`
    : "Découvrez nos prestations d'imprimerie numérique, offset, sérigraphie, grand format, signalétique et conception graphique à Ngaoundéré par BARKA SOLUTIONS S.A.S.";

  const servicesJsonLd = selectedService
    ? {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': selectedService.title,
        'provider': {
          '@type': 'LocalBusiness',
          'name': 'BARKA SOLUTIONS S.A.S',
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': 'Derrière le Restaurant Le Verger',
            'addressLocality': 'Ngaoundéré',
            'addressRegion': 'Adamaoua',
            'addressCountry': 'CM',
          },
        },
        'areaServed': 'Ngaoundéré, Adamaoua, Cameroun',
        'description': selectedService.fullDesc || selectedService.shortDesc,
        'offers': {
          '@type': 'Offer',
          'priceCurrency': 'XAF',
          'price': selectedService.priceStartingAt,
          'availability': 'https://schema.org/InStock',
        },
      }
    : {
        '@context': 'https://schema.org',
        '@type': 'OfferCatalog',
        'name': 'Catalogue des services BARKA SOLUTIONS S.A.S',
        'itemListElement': services.slice(0, 10).map((srv) => ({
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': srv.title,
            'description': srv.shortDesc,
          },
        })),
      };

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        keywords="imprimerie Ngaoundéré, impression numérique Ngaoundéré, impression offset Ngaoundéré, sérigraphie Ngaoundéré, impression grand format Ngaoundéré, conception graphique Ngaoundéré, signalétique Ngaoundéré, BARKA SOLUTIONS"
        jsonLd={servicesJsonLd}
      />

      <ServicesScreen
        onBack={() => navigate('/')}
        onSelectService={handleSelectService}
        onSelectTab={handleSelectTab}
        initialServices={services}
      />

      <ServiceDetailModal
        service={selectedService}
        onClose={handleCloseModal}
        onOrderQuote={handleOrderQuote}
      />
    </>
  );
};
