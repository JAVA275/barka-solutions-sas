import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Layers,
  CreditCard,
  Calendar,
  Gift,
  Shirt,
  Stamp,
  Maximize,
  Monitor,
  MessageCircle,
  FileText,
  Sparkles,
  CheckCircle2,
  Phone,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import { TabType, PriceCategory, PriceGridItem } from '../types';
import { COMPANY_INFO, PRICE_GRID_CATEGORIES } from '../data/mockData';
import { apiService } from '../services/api';

interface PricesScreenProps {
  onBack: () => void;
  onSelectTab: (tab: TabType) => void;
  onPreselectQuoteProduct?: (productId: string) => void;
  initialCategories?: PriceCategory[];
}

export const PricesScreen: React.FC<PricesScreenProps> = ({
  onBack,
  onSelectTab,
  onPreselectQuoteProduct,
  initialCategories,
}) => {
  const [categories, setCategories] = useState<PriceCategory[]>(initialCategories || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCategories || initialCategories.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchPriceCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiService.getPriceCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setError(res.error || 'Impossible de charger les tarifs depuis le serveur.');
      }
    } catch (err: unknown) {
      console.error('Erreur chargement tarifs:', err);
      const msg = err instanceof Error ? err.message : 'Impossible de joindre le serveur.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceCategories();
  }, []);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen className="w-5 h-5" />;
      case 'Layers':
        return <Layers className="w-5 h-5" />;
      case 'CreditCard':
        return <CreditCard className="w-5 h-5" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5" />;
      case 'Gift':
        return <Gift className="w-5 h-5" />;
      case 'Shirt':
        return <Shirt className="w-5 h-5" />;
      case 'Stamp':
        return <Stamp className="w-5 h-5" />;
      case 'Maximize':
        return <Maximize className="w-5 h-5" />;
      case 'Monitor':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  // Flatten or filter items based on search and category
  const filteredCategories = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return categories.map((cat) => {
      // Check if category matches filter
      const matchesCategory = selectedCatId === 'all' || cat.id === selectedCatId;
      if (!matchesCategory) return null;

      const matchedItems = (cat.items || []).filter((item) => {
        if (item.active === false) return false;
        if (!query) return true;
        return (
          item.name.toLowerCase().includes(query) ||
          (item.category && item.category.toLowerCase().includes(query)) ||
          (item.format && item.format.toLowerCase().includes(query)) ||
          (item.specs && item.specs.toLowerCase().includes(query)) ||
          String(item.unitPrice).toLowerCase().includes(query)
        );
      });

      if (matchedItems.length === 0) return null;

      return {
        ...cat,
        items: matchedItems,
      };
    }).filter(Boolean) as PriceCategory[];
  }, [categories, selectedCatId, searchQuery]);

  const totalItemsCount = useMemo(() => {
    return filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0);
  }, [filteredCategories]);

  const handleOrderWhatsApp = (item: PriceGridItem) => {
    const message = `Bonjour BARKA SOLUTIONS S.A.S,%0A%0AJe souhaite passer une commande ou avoir des précisions sur le produit suivant :%0A- *Produit* : ${encodeURIComponent(item.name)}%0A- *Format / Spécification* : ${encodeURIComponent(item.format || item.specs || 'Standard')}%0A- *Tarif* : Sur devis personnalisé%0A%0AMerci de m'indiquer la disponibilité et les modalités de commande à Ngaoundéré.`;

    const waNumber = (COMPANY_INFO.whatsapp_raw || COMPANY_INFO.whatsapp || '237696311198').replace(/\D/g, '');
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8" id="tarifs-screen-content">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={onBack}
            aria-label="Retour à l'accueil"
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 transition-colors border border-slate-200 shadow-2xs cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0010c2] text-xs font-bold border border-blue-200/60 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Grille Tarifaire Officielle 2026</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Tarifs & Prix des Prestations
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectTab('devis')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Simulateur de Devis</span>
          </motion.button>

          <motion.a
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            href={`https://wa.me/${(COMPANY_INFO.whatsapp_raw || COMPANY_INFO.whatsapp || '237696311198').replace(/\D/g, '')}?text=Bonjour%20BARKA%20SOLUTIONS%2C%20je%20souhaite%20un%20renseignement%20sur%20vos%20tarifs.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-colors shadow-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp Direct</span>
            <span className="sm:hidden">WhatsApp</span>
          </motion.a>
        </div>
      </div>

      {/* Error state with retry */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error} Données locales de secours affichées.</span>
          </div>
          <button
            onClick={fetchPriceCategories}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      )}

      {/* Hero Notice Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0010c2]/90 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Prix clairs, transparents & dégressifs à Ngaoundéré</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Consultez nos prestations et demandez un devis instantané
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Toutes nos prestations sont réalisées <strong>sur mesure et sur devis personnalisé</strong> selon vos spécifications et quantités. Contactez directement nos ateliers à Ngaoundéré.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-xs bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-xs border border-white/10">
          <Clock className="w-4 h-4 text-orange-400 shrink-0" />
          <div className="leading-tight">
            <span className="font-bold block text-white">Horaires d'ouverture</span>
            <span className="text-slate-300 text-[11px]">Lun-Ven : 08h00 - 18h00 | Sam : 08h00 - 13h00</span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit (ex: Facturier, Flyers, Cachet Trodat, Tasse, Affiche, Bâche, Polo, Disque dur...)"
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-2 py-1 rounded-lg cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCatId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCatId === 'all'
                ? 'bg-[#0010c2] text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Tous les tarifs ({categories.reduce((acc, c) => acc + (c.items?.filter((i) => i.active !== false).length || 0), 0)})
          </motion.button>
          {categories.map((cat) => {
            const count = cat.items?.filter((i) => i.active !== false).length || 0;
            return (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCatId === cat.id
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {getCategoryIcon(cat.iconName)}
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Loading, Error, Empty, and Success states */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-[#0010c2] animate-spin" />
          <p className="text-xs sm:text-sm font-bold text-slate-700">Chargement de la grille tarifaire...</p>
        </div>
      ) : error && categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-3xl border border-rose-200 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Impossible de charger les tarifs</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-400">Le serveur est peut-être indisponible. Vos tarifs enregistrés restent sauvegardés sur le serveur.</p>
          </div>
          <button
            onClick={fetchPriceCategories}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Aucun tarif configuré</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            La grille tarifaire est actuellement vide ou en cours de mise à jour par les administrateurs.
          </p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Aucun produit trouvé pour « {searchQuery} »</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Nous réalisons également des impressions et confections sur-mesure. Contactez directement notre atelier.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCatId('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35 }}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden"
              id={`tarif-section-${category.id}`}
            >
              {/* Category Header Bar */}
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#0010c2] text-white shadow-2xs">
                    {getCategoryIcon(category.iconName)}
                  </div>
                  <div>
                    <h3
                      className="text-base sm:text-lg font-bold text-slate-900"
                      style={{ fontFamily: 'Outfit, sans-serif' }}
                    >
                      {category.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {category.description}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200/70 self-start sm:self-auto">
                  {category.items.length} référence{category.items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Items Table / Cards Grid */}
              <div className="divide-y divide-slate-100">
                {category.items.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            {item.name}
                          </h4>
                          {item.popular && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                              Très demandé
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                          {item.format && (
                            <span className="inline-flex items-center gap-1">
                              <strong className="text-slate-700">Format :</strong> {item.format}
                            </span>
                          )}
                          {item.specs && (
                            <span className="inline-flex items-center gap-1">
                              <strong className="text-slate-700">Détails :</strong> {item.specs}
                            </span>
                          )}
                          {item.minQty && (
                            <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                              ({item.minQty})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pricing & WhatsApp action */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg block">
                            Sur devis
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Chiffrage sur mesure
                          </span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleOrderWhatsApp(item)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer shrink-0"
                          title="Passer une commande pour ce produit sur WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Passer une commande</span>
                        </motion.button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom CTA Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-lg sm:text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Vous avez un grand tirage ou un projet spécial ?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Bénéficiez de remises quantitatives exceptionnelles et d’un accompagnement graphique dédié par nos techniciens à Ngaoundéré.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('devis')}
            className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
          >
            Faire une simulation complète
          </button>
          <a
            href={`tel:${COMPANY_INFO.phone1}`}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
            title="Appeler BARKA SOLUTIONS"
          >
            <Phone className="w-5 h-5 text-orange-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
