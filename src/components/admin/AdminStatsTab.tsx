import React from 'react';
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Image,
  Layers,
  ArrowUpRight,
  Download,
  Send,
  Search,
  CheckCheck,
  PackageCheck,
  Cog,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { SubmittedQuote, ServerStats, ContactMessage, PortfolioItem } from '../../types';
import { OFFICIAL_QUOTE_STATUSES, getQuoteStatusInfo } from '../../utils/quoteStatus';

interface AdminStatsTabProps {
  quotes: SubmittedQuote[];
  stats: ServerStats | null;
  messages: ContactMessage[];
  portfolio: PortfolioItem[];
  isLoading?: boolean;
  onNavigateTab: (tab: any, statusFilter?: string) => void;
  onExportQuotesCSV: () => void;
  onRetry?: () => void;
}

export const AdminStatsTab: React.FC<AdminStatsTabProps> = ({
  quotes,
  stats,
  messages,
  portfolio,
  isLoading = false,
  onNavigateTab,
  onExportQuotesCSV,
  onRetry,
}) => {
  // Compute the 7 required metrics
  const totalQuotes = stats?.totalQuotes ?? quotes.length;
  
  const newQuotesCount =
    stats?.newQuotes ??
    quotes.filter((q) => q.status === 'NOUVEAU' || q.status === 'Nouveau').length;

  const inAnalysisCount =
    ((stats?.inAnalysis ?? 0) + (stats?.inPrep ?? 0)) ||
    quotes.filter((q) => ['EN_ANALYSE', 'DEVIS_EN_PREPARATION'].includes(q.status)).length;

  const sentQuotesCount =
    ((stats?.sent ?? 0) + (stats?.waitingClient ?? 0)) ||
    quotes.filter((q) => ['DEVIS_ENVOYE', 'EN_ATTENTE_CLIENT'].includes(q.status)).length;

  const acceptedCount =
    stats?.accepted ??
    quotes.filter((q) => q.status === 'ACCEPTE').length;

  const inProductionCount =
    stats?.inProduction ??
    quotes.filter((q) => q.status === 'EN_PRODUCTION' || q.status === 'En cours').length;

  const completedCount =
    stats?.completed ??
    quotes.filter((q) => ['TERMINE', 'Traité', 'Archivé'].includes(q.status)).length;

  const unreadMessagesCount = messages.filter((m) => !m.read).length;

  const totalEstimatedRevenue = quotes.reduce((acc, q) => acc + (Number(q.estimatedPrice) || 0), 0);
  const validatedRevenue = quotes
    .filter((q) => ['ACCEPTE', 'EN_PRODUCTION', 'TERMINE', 'Traité'].includes(q.status))
    .reduce((acc, q) => acc + (Number(q.finalPrice || q.estimatedPrice) || 0), 0);

  // Conversion rate
  const convertedQuotes = quotes.filter((q) => ['ACCEPTE', 'EN_PRODUCTION', 'TERMINE', 'Traité'].includes(q.status)).length;
  const conversionRate = totalQuotes > 0 ? Math.round((convertedQuotes / totalQuotes) * 100) : 0;

  // Breakdown by pole
  const imprimerieQuotes = quotes.filter((q) =>
    ['Impression Offset', 'Impression numérique HD', 'Sérigraphie', 'Grand format', 'Carnets & Facturiers', 'Papeterie'].some((k) =>
      (q.typePrestation || '').toLowerCase().includes(k.toLowerCase())
    )
  ).length;

  const brandingQuotes = quotes.filter((q) =>
    ['Branding', 'Conception graphique', 'Signalétique', 'Enseignes', 'Logo'].some((k) =>
      (q.typePrestation || '').toLowerCase().includes(k.toLowerCase())
    )
  ).length;

  const solutionsProQuotes = Math.max(0, totalQuotes - imprimerieQuotes - brandingQuotes);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton banner */}
        <div className="h-44 bg-slate-200/80 rounded-3xl animate-pulse" />
        {/* Loading skeleton cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200/80 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200/80 rounded-2xl animate-pulse" />
          <div className="h-72 bg-slate-200/80 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            Tableau de Bord Analytique
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-['Outfit']">
            Performance BARKA SOLUTIONS
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Suivi en temps réel des 7 indicateurs clés de production et de relation client à Ngaoundéré.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/10"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              Actualiser
            </button>
          )}
          <button
            onClick={onExportQuotesCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/10 shadow-sm"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Exporter Devis (CSV)
          </button>
          <button
            onClick={() => onNavigateTab('quotes', 'NOUVEAU')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition cursor-pointer shadow-md"
          >
            <FileText className="w-4 h-4" />
            Traiter les devis ({newQuotesCount})
          </button>
        </div>
      </div>

      {/* 7 Indicateurs Exigés du Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <span>Indicateurs de Pilotage Officiels</span>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full">7 Métriques</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Cliquez sur une métrique pour filtrer</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {/* 1. Nombre de devis */}
          <div
            onClick={() => onNavigateTab('quotes', 'Tous')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-900 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">Nombre de devis</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center group-hover:scale-110 transition">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 font-['Outfit']">{totalQuotes}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Total général</div>
            </div>
          </div>

          {/* 2. Nouveaux devis */}
          <div
            onClick={() => onNavigateTab('quotes', 'NOUVEAU')}
            className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition cursor-pointer group flex flex-col justify-between ${
              newQuotesCount > 0
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800">Nouveaux devis</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-amber-700 font-['Outfit']">{newQuotesCount}</div>
              <div className="text-[10px] text-amber-800/80 font-bold mt-0.5">À qualifier</div>
            </div>
          </div>

          {/* 3. Devis en analyse */}
          <div
            onClick={() => onNavigateTab('quotes', 'EN_ANALYSE')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-900 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Devis en analyse</span>
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center group-hover:scale-110 transition">
                <Search className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-sky-700 font-['Outfit']">{inAnalysisCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Étude & chiffrage</div>
            </div>
          </div>

          {/* 4. Devis envoyés */}
          <div
            onClick={() => onNavigateTab('quotes', 'DEVIS_ENVOYE')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-900 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Devis envoyés</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:scale-110 transition">
                <Send className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-purple-700 font-['Outfit']">{sentQuotesCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">En attente client</div>
            </div>
          </div>

          {/* 5. Devis acceptés */}
          <div
            onClick={() => onNavigateTab('quotes', 'ACCEPTE')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-700 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800">Devis acceptés</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
                <CheckCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-700 font-['Outfit']">{acceptedCount}</div>
              <div className="text-[10px] text-emerald-800/80 font-bold mt-0.5">Bons pour accord</div>
            </div>
          </div>

          {/* 6. Projets en production */}
          <div
            onClick={() => onNavigateTab('quotes', 'EN_PRODUCTION')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-700 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800">En production</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-110 transition">
                <Cog className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-indigo-700 font-['Outfit']">{inProductionCount}</div>
              <div className="text-[10px] text-indigo-800/80 font-bold mt-0.5">Atelier / Impression</div>
            </div>
          </div>

          {/* 7. Projets terminés */}
          <div
            onClick={() => onNavigateTab('quotes', 'TERMINE')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-800 transition cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">Projets terminés</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-110 transition">
                <PackageCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-teal-800 font-['Outfit']">{completedCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Livrés & clôturés</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial & conversion summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CA Estimé */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Volume Total Estimé</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2.5 font-['Outfit']">
            {totalEstimatedRevenue.toLocaleString('fr-FR')} <span className="text-xs text-emerald-800 font-bold">FCFA</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Cumul de l’ensemble des demandes</div>
        </div>

        {/* CA Validé */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">CA Validé / En cours</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-2.5 font-['Outfit']">
            {validatedRevenue.toLocaleString('fr-FR')} <span className="text-xs text-indigo-800 font-bold">FCFA</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Taux de concrétisation : <strong className="text-indigo-900">{conversionRate}%</strong>
          </div>
        </div>

        {/* Portfolio Actif */}
        <div
          onClick={() => onNavigateTab('portfolio')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Réalisations Publiques</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2.5 font-['Outfit']">
            {portfolio.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Projets visibles en galerie</div>
        </div>

        {/* Messages de contact */}
        <div
          onClick={() => onNavigateTab('messages')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Messages de Contact</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2.5 font-['Outfit']">
            {messages.length}{' '}
            {unreadMessagesCount > 0 && (
              <span className="text-xs font-bold text-amber-600">({unreadMessagesCount} non lus)</span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">Demandes transmises par le formulaire</div>
        </div>
      </div>

      {/* Status Breakdown & Poles Distribution */}
      {totalQuotes === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Aucun devis enregistré pour le moment</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Les demandes soumises par vos clients depuis la page publique de devis apparaîtront instantanément ici.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('quotes')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Consulter la section Devis
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Status Distribution (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Répartition par Statut de Devis</h3>
                <p className="text-xs text-slate-500">Progression du pipeline de devis selon les 9 statuts officiels.</p>
              </div>
              <span className="text-xs font-bold text-slate-400">{totalQuotes} total</span>
            </div>

            <div className="space-y-3 pt-2">
              {OFFICIAL_QUOTE_STATUSES.map((statusKey) => {
                const info = getQuoteStatusInfo(statusKey);
                const count = quotes.filter((q) => q.status === statusKey || getQuoteStatusInfo(q.status).key === statusKey).length;
                const percentage = totalQuotes > 0 ? Math.round((count / totalQuotes) * 100) : 0;

                return (
                  <div
                    key={statusKey}
                    onClick={() => onNavigateTab('quotes', statusKey)}
                    className="space-y-1 p-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${info.dotColor}`} />
                        <span className="font-bold text-slate-800">{info.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{count} devis</span>
                        <span className="text-slate-900 font-bold w-10 text-right">{percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${info.badgeBg}`}
                        style={{ width: `${Math.max(percentage, count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Poles Distribution & Quick Links (1 Col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Répartition par Pôle
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-blue-900" />
                    <span className="font-bold text-slate-800">1. Imprimerie & Sérigraphie</span>
                  </div>
                  <span className="font-black text-blue-950">{imprimerieQuotes} devis</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-amber-500" />
                    <span className="font-bold text-slate-800">2. Communication & Branding</span>
                  </div>
                  <span className="font-black text-amber-950">{brandingQuotes} devis</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md bg-slate-700" />
                    <span className="font-bold text-slate-800">3. Solutions Pro & BTP</span>
                  </div>
                  <span className="font-black text-slate-950">{solutionsProQuotes} devis</span>
                </div>
              </div>
            </div>

            {/* Quick Management Shortcuts */}
            <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-5 text-white shadow-md space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">Raccourcis de Gestion</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={() => onNavigateTab('services')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition cursor-pointer flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Services
                </button>
                <button
                  onClick={() => onNavigateTab('tarifs')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  Grille Tarifs
                </button>
                <button
                  onClick={() => onNavigateTab('portfolio')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition cursor-pointer flex items-center gap-1.5"
                >
                  <Image className="w-3.5 h-3.5 text-amber-400" />
                  Portfolio ({portfolio.length})
                </button>
                <button
                  onClick={() => onNavigateTab('messages')}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-left transition cursor-pointer flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  Messages ({messages.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

