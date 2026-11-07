import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Printer,
  Signpost,
  ShoppingBag,
  BookOpen,
  Maximize,
  Shirt,
  Palette,
  Layers,
  Sparkles,
  Search,
  Building2,
  Package,
  Wrench,
  FileText,
  Briefcase,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType, ServiceItem } from '../types';
import { SERVICE_GROUPS, SERVICES_DATA } from '../data/mockData';
import { apiService } from '../services/api';

interface ServicesScreenProps {
  onBack: () => void;
  onSelectService: (service: ServiceItem) => void;
  onSelectTab: (tab: TabType) => void;
  initialServices?: ServiceItem[];
}

export const ServicesScreen: React.FC<ServicesScreenProps> = ({
  onBack,
  onSelectService,
  onSelectTab,
  initialServices,
}) => {
  const [services, setServices] = useState<ServiceItem[]>(initialServices || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialServices || initialServices.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchServices = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.getServices(false);
      if (res.success && Array.isArray(res.data)) {
        setServices(res.data);
      } else {
        setError(res.error || 'Impossible de charger les services depuis le serveur.');
      }
    } catch (err: unknown) {
      console.error('Erreur chargement services:', err);
      const msg = err instanceof Error ? err.message : 'Impossible de joindre le serveur.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Printer':
        return Printer;
      case 'Signpost':
        return Signpost;
      case 'ShoppingBag':
        return ShoppingBag;
      case 'BookOpen':
        return BookOpen;
      case 'Maximize':
        return Maximize;
      case 'Shirt':
        return Shirt;
      case 'Palette':
        return Palette;
      case 'Building2':
        return Building2;
      case 'Package':
        return Package;
      case 'Wrench':
        return Wrench;
      case 'Briefcase':
        return Briefcase;
      default:
        return Layers;
    }
  };

  const filteredServices = services.filter((service) => {
    const matchesGroup = selectedGroupId === 'all' || service.groupId === selectedGroupId;
    const matchesSearch =
      !searchQuery.trim() ||
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.groupTitle && service.groupTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8" id="services-screen-content">
      {/* Top Header Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Retour à l'accueil"
            id="services-back-btn"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 transition-colors border border-slate-200 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Nos Pôles d'Expertise & Services
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Imprimerie industrielle, communication visuelle et solutions multiservices à Ngaoundéré
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.025, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectTab('devis')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Demander un devis immédiat</span>
        </motion.button>
      </div>

      {/* Error state with retry */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error} Données locales de secours affichées.</span>
          </div>
          <button
            onClick={fetchServices}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      )}

      {/* Filter Toolbar: 3 Major Groups + Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un service (ex: cartes de visite, roll-up, enseigne LED, sérigraphie)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 transition"
          />
        </div>

        {/* 3 Main Categories Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`p-3 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
              selectedGroupId === 'all'
                ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">Toutes les offres</span>
              <span className="text-xs font-bold block truncate">Vue Complète</span>
            </div>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${selectedGroupId === 'all' ? 'bg-amber-400 text-blue-950' : 'bg-slate-200 text-slate-700'}`}>
              {services.length}
            </span>
          </button>

          {SERVICE_GROUPS.map((group) => {
            const isSelected = selectedGroupId === group.id;
            const count = services.filter((s) => s.groupId === group.id).length;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`p-3 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="min-w-0">
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${isSelected ? 'text-amber-300' : 'text-blue-900 font-black'}`}>
                    {group.number}. {group.id === 'imprimerie' ? 'Imprimerie' : group.id === 'communication-branding' ? 'Communication' : 'Solutions Pro'}
                  </span>
                  <span className="text-xs font-bold block truncate">{group.title}</span>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-amber-400 text-blue-950' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area based on State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
          <p className="text-xs sm:text-sm font-bold text-slate-700">Chargement des prestations en cours...</p>
        </div>
      ) : error && services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-2xl border border-rose-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Impossible de charger les services</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-400">Le serveur est peut-être indisponible ou votre connexion est instable.</p>
          </div>
          <button
            onClick={fetchServices}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Aucun service disponible</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Le catalogue des prestations est actuellement vide ou en cours de mise à jour.</p>
        </div>
      ) : (
        <>
          {/* Services Rendered by Group */}
          {selectedGroupId === 'all' && !searchQuery.trim() ? (
            // Grouped Presentation
            <div className="space-y-10">
              {SERVICE_GROUPS.map((group) => {
                const groupServices = services.filter((s) => s.groupId === group.id);
                if (groupServices.length === 0) return null;

                return (
                  <section key={group.id} className="space-y-4">
                    {/* Group Header Banner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black bg-blue-900 text-amber-400 px-2 py-0.5 rounded">
                            {group.number}
                          </span>
                          <h2 className="text-xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {group.title}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{group.subtitle}</p>
                      </div>

                      <span className="text-xs font-bold text-slate-400 self-start sm:self-auto">
                        {groupServices.length} prestations disponibles
                      </span>
                    </div>

                    {/* Group Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {groupServices.map((service, sIdx) => {
                        const IconComponent = getIcon(service.iconName);
                        return (
                          <motion.div
                            key={service.id}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35, delay: sIdx * 0.04 }}
                            whileHover={{ y: -4, scale: 1.015 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => onSelectService(service)}
                            id={`service-card-${service.id}`}
                            className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-shadow duration-300 flex flex-col justify-between cursor-pointer group"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-900 group-hover:text-amber-400 text-blue-900 border border-blue-100 flex items-center justify-center transition-all duration-300 group-hover:scale-108 group-hover:rotate-2">
                                  <IconComponent className="w-6 h-6 stroke-[2]" />
                                </div>

                                {service.popular && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                    Populaire
                                  </span>
                                )}
                              </div>

                              <div>
                                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                                  {service.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                  {service.shortDesc}
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full text-[11px]">
                                Sur devis personnalisé
                              </span>

                              <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-900 font-bold group-hover:translate-x-1 transition-transform">
                                <span>Détails & Devis</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            // Flat filtered grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServices.map((service, sIdx) => {
                const IconComponent = getIcon(service.iconName);
                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: sIdx * 0.03 }}
                    whileHover={{ y: -4, scale: 1.015 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectService(service)}
                    id={`service-card-${service.id}`}
                    className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-300 transition-shadow duration-300 flex flex-col justify-between cursor-pointer group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-900 group-hover:text-amber-400 text-blue-900 border border-blue-100 flex items-center justify-center transition-all duration-300 group-hover:scale-108 group-hover:rotate-2">
                          <IconComponent className="w-6 h-6 stroke-[2]" />
                        </div>

                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {service.groupTitle || 'Service'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {service.shortDesc}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full text-[11px]">
                        Sur devis personnalisé
                      </span>

                      <span className="inline-flex items-center gap-1 text-slate-400 group-hover:text-blue-900 font-bold group-hover:translate-x-1 transition-transform">
                        <span>Détails & Devis</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {filteredServices.length === 0 && services.length > 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">Aucun service ne correspond à votre recherche</h3>
              <p className="text-xs text-slate-500 mt-1">Veuillez ajuster votre mot-clé ou réinitialiser les filtres.</p>
              <button
                onClick={() => {
                  setSelectedGroupId('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom CTA Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-lg border border-slate-800">
        <h3 className="text-lg sm:text-xl font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Un projet spécifique ou une commande grand volume ?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Nos techniciens et graphistes examinent vos fichiers et vous proposent les solutions techniques les plus économiques et durables.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onSelectTab('devis')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4 text-slate-950" />
            <span>Configurer mon devis en ligne</span>
          </button>
          <button
            onClick={() => onSelectTab('contact')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm transition-all border border-slate-700 cursor-pointer"
          >
            <span>Contacter l'atelier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
