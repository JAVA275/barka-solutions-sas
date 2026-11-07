import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sparkles, ZoomIn, FileText, Search, Tag, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { PortfolioItem, TabType, PortfolioCategory } from '../types';
import { apiService } from '../services/api';

interface PortfolioScreenProps {
  onBack: () => void;
  onOpenLightbox: (item: PortfolioItem) => void;
  onSelectTab: (tab: TabType) => void;
}

const RECOMMENDED_CATEGORIES: (string | PortfolioCategory)[] = [
  'Tous',
  'Imprimerie',
  'Offset',
  'Numérique',
  'Sérigraphie',
  'Grand format',
  'Branding',
  'Signalétique',
  'Conception graphique',
  'Communication',
  'Autres',
];

export const PortfolioScreen: React.FC<PortfolioScreenProps> = ({
  onBack,
  onOpenLightbox,
  onSelectTab,
}) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.getPortfolio();
      if (res.success && Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setError(res.error || 'Impossible de charger les réalisations depuis le serveur.');
      }
    } catch (err: unknown) {
      console.error('Erreur chargement portfolio:', err);
      const msg = err instanceof Error ? err.message : 'Impossible de joindre le serveur.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      activeCategory === 'Tous' ||
      item.category === activeCategory ||
      (item.categories && item.categories.includes(activeCategory as PortfolioCategory));

    const matchesSearch =
      !searchQuery.trim() ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.client && item.client.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6" id="portfolio-screen-content">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Retour à l'accueil"
            id="portfolio-back-btn"
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 transition-colors border border-slate-200 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Portfolio & Réalisations
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Découvrez la qualité d’exécution et le savoir-faire de nos ateliers à Ngaoundéré
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
          <span>Demander un devis similaire</span>
        </motion.button>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par projet, client, support (ex: enseigne, catalogue, t-shirt)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-900 transition"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" id="portfolio-category-filters">
          {RECOMMENDED_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count = cat === 'Tous'
              ? items.length
              : items.filter((i) => i.category === cat || (i.categories && i.categories.includes(cat as any))).length;

            return (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={cat}
                onClick={() => setActiveCategory(cat)}
                id={`portfolio-filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-amber-400 text-blue-950 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Error state */}
      {error && items.length === 0 ? (
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Impossible de charger le portfolio</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-400">Le serveur est peut-être indisponible ou votre connexion a été interrompue.</p>
          </div>
          <button
            onClick={fetchPortfolio}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : error ? (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchPortfolio}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : null}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse flex flex-col">
              <div className="aspect-4/3 bg-slate-200" />
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grid of Realizations */}
      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5" id="portfolio-grid">
          {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onOpenLightbox(item)}
              id={`portfolio-card-${item.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-shadow duration-300 cursor-pointer border border-slate-200 flex flex-col"
            >
              {/* Image Container */}
              <div className="relative aspect-4/3 bg-slate-900 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  loading="lazy"
                />

                <div className="absolute top-3 left-3 bg-blue-950/80 backdrop-blur-xs text-amber-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border border-amber-400/30">
                  {item.category}
                </div>

                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                  {item.featured && (
                    <div className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
                      <Sparkles className="w-3 h-3" />
                      À la une
                    </div>
                  )}
                  {item.isDemo && (
                    <div className="bg-slate-900/80 text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-slate-700">
                      Spécimen démo
                    </div>
                  )}
                </div>

                {/* Hover overlay indicator */}
                <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/90 text-blue-900 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-900 transition leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {/* Client and Year */}
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-semibold truncate max-w-[180px]">
                      {item.client || (item.isDemo ? 'Spécimen atelier' : 'Client BARKA SOLUTIONS')}
                    </span>
                    <span className="text-slate-400 font-mono">{item.year || '2026'}</span>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-medium self-center">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && items.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Aucune réalisation publiée</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Les projets d'atelier seront publiés très prochainement dans la galerie.
          </p>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && filteredItems.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Aucune réalisation trouvée</h3>
          <p className="text-xs text-slate-500 mt-1">
            Essayez de modifier votre filtre de catégorie ou vos termes de recherche.
          </p>
          <button
            onClick={() => {
              setActiveCategory('Tous');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};

