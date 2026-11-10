import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Briefcase,
  Printer,
  KeyRound,
  Settings,
  MessageSquare,
  Lock,
  Calendar,
  X,
  ChevronDown,
} from 'lucide-react';
import { AuditLog, AuditResource, AuditAction, UserRole, AuthUser } from '../../types';
import { apiService } from '../../services/api';

interface AdminAuditTabProps {
  currentUser: AuthUser;
}

export const AdminAuditTab: React.FC<AdminAuditTabProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<{
    totalLogs: number;
    byRole: Record<string, number>;
    byAction: Record<string, number>;
    byResource: Record<string, number>;
    recentLogsCount: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedResource, setSelectedResource] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [limit, setLimit] = useState<number>(100);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchAuditData = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    setError(null);

    try {
      const [logsRes, statsRes] = await Promise.all([
        apiService.getAuditLogs({
          resource: selectedResource,
          action: selectedAction,
          role: selectedRole,
          search: searchQuery.trim() || undefined,
          limit,
        }),
        apiService.getAuditStats(),
      ]);

      if (logsRes.success && logsRes.logs) {
        setLogs(logsRes.logs);
      } else {
        setError(logsRes.error || 'Erreur lors du chargement des journaux d’audit');
      }

      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditData(true);
  }, [selectedResource, selectedAction, selectedRole, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAuditData(true);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAuditData(false);
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return { label: 'CRÉATION', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'UPDATE':
        return { label: 'MODIFICATION', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'DELETE':
        return { label: 'SUPPRESSION', bg: 'bg-red-500/10 text-red-400 border-red-500/30' };
      case 'STATUS_CHANGE':
        return { label: 'CHANGEMENT STATUT', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'TOGGLE_STATUS':
        return { label: 'ACTIVATION/DÉSACTIVATION', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'LOGIN':
        return { label: 'CONNEXION', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'LOGOUT':
        return { label: 'DÉCONNEXION', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
      case 'EMAIL_SENT':
        return { label: 'EMAIL EXPÉDIÉ', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      default:
        return { label: action || 'ACTION', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' };
    }
  };

  const getResourceIcon = (resource: string) => {
    switch (resource?.toUpperCase()) {
      case 'DEVIS':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'TARIF':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'PORTFOLIO':
        return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'SERVICE':
        return <Printer className="w-4 h-4 text-purple-400" />;
      case 'USER':
        return <User className="w-4 h-4 text-indigo-400" />;
      case 'COMPANY_SETTINGS':
        return <Settings className="w-4 h-4 text-rose-400" />;
      case 'MESSAGE':
        return <MessageSquare className="w-4 h-4 text-teal-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6" id="admin-audit-section">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldAlert className="w-4 h-4" />
            Traçabilité & Sécurité Administrative
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            Journal d'Audit Administratif
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
              {logs.length} entrée{logs.length > 1 ? 's' : ''}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historique certifié des actions des comptes ADMIN et EDITOR (créations, modifications de tarifs, suppressions, statuts).
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold border border-slate-600 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
          Actualiser les logs
        </button>
      </div>

      {/* Stats Summary Bento Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Actions</div>
              <div className="text-xl font-bold text-white">{stats.totalLogs}</div>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Dernières 24h</div>
              <div className="text-xl font-bold text-white">{stats.recentLogsCount}</div>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Actions ADMIN</div>
              <div className="text-xl font-bold text-white">{stats.byRole?.ADMIN || 0}</div>
            </div>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Actions EDITOR</div>
              <div className="text-xl font-bold text-white">{stats.byRole?.EDITOR || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* Security Guarantee Notice */}
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            <strong className="text-white">Confidentialité & Sécurité :</strong> Les mots de passe et jetons d'accès ne sont jamais enregistrés dans les journaux d'audit (masquage cryptographique automatique).
          </span>
        </div>
        <span className="hidden md:inline-block text-[11px] text-slate-500 font-mono">
          ISO / RGPD Compatible
        </span>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par description, utilisateur, titre de ressource ou ID..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Resource */}
            <select
              value={selectedResource}
              onChange={(e) => setSelectedResource(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">Toutes les ressources</option>
              <option value="DEVIS">Commandes</option>
              <option value="TARIF">Tarifs</option>
              <option value="SERVICE">Services</option>
              <option value="PORTFOLIO">Portfolio</option>
              <option value="USER">Comptes Utilisateurs</option>
              <option value="COMPANY_SETTINGS">Paramètres Entreprise</option>
              <option value="MESSAGE">Messages Contact</option>
            </select>

            {/* Filter Action */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">Toutes les actions</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
              <option value="STATUS_CHANGE">Changement de statut</option>
              <option value="TOGGLE_STATUS">Activation / Désactivation</option>
              <option value="LOGIN">Connexion</option>
              <option value="LOGOUT">Déconnexion</option>
            </select>

            {/* Filter Role */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="EDITOR">EDITOR</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Filtrer
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-white">Chargement des entrées d'audit...</p>
          <p className="text-xs text-slate-500 mt-1">Interrogation sécurisée de la base de données BARKA</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-2xl p-8 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Erreur de chargement de l'audit</h3>
          <p className="text-xs text-red-300 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchAuditData(true)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && logs.length === 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center text-slate-400">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Aucune entrée d'audit trouvée</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Aucune action administrative ne correspond aux filtres appliqués ou aucun journal n'a encore été enregistré.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedResource('ALL');
              setSelectedAction('ALL');
              setSelectedRole('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Logs Table / List View */}
      {!isLoading && !error && logs.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/80">
                <tr>
                  <th className="py-3.5 px-4">Date & Heure</th>
                  <th className="py-3.5 px-4">Utilisateur / Rôle</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Ressource</th>
                  <th className="py-3.5 px-4">Description de l'action</th>
                  <th className="py-3.5 px-4 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {logs.map((log) => {
                  const actionBadge = getActionBadge(log.action);
                  const isUserAdmin = log.role === 'ADMIN';

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-750/70 transition-colors cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatDateTime(log.createdAt)}
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isUserAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {log.username?.substring(0, 2).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-xs">{log.username}</div>
                            <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                              isUserAdmin ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {log.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${actionBadge.bg}`}>
                          {actionBadge.label}
                        </span>
                      </td>

                      {/* Resource */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-slate-900 border border-slate-700">
                            {getResourceIcon(log.resource)}
                          </div>
                          <div>
                            <span className="font-semibold text-white text-xs block">{log.resource}</span>
                            <span className="text-[10px] text-slate-400 font-mono">#{log.resourceId}</span>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <p className="text-xs text-slate-200 line-clamp-2 max-w-md">
                          {log.description}
                        </p>
                      </td>

                      {/* View Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white text-xs transition border border-slate-600"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Détails</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Détail de l'entrée d'audit</h3>
                  <div className="text-xs text-slate-400 font-mono">ID: {selectedLog.id}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Date & Heure</span>
                  <span className="text-white font-medium">{formatDateTime(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Utilisateur</span>
                  <span className="text-white font-medium">{selectedLog.username} ({selectedLog.userFullName || 'Administrateur'})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Rôle</span>
                  <span className="text-amber-400 font-bold">{selectedLog.role}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Action</span>
                  <span className="text-white font-bold">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Ressource</span>
                  <span className="text-white font-medium">{selectedLog.resource} (#{selectedLog.resourceId})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Adresse IP</span>
                  <span className="text-slate-300 font-mono">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>

              {/* Natural Description */}
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Description de l'action
                </div>
                <p className="text-sm font-semibold text-white">
                  {selectedLog.description}
                </p>
                {selectedLog.resourceTitle && (
                  <p className="text-xs text-slate-400 mt-1">
                    Élément ciblé : <span className="text-amber-300">{selectedLog.resourceTitle}</span>
                  </p>
                )}
              </div>

              {/* State Diff Comparison (Old Value vs New Value) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Old Value */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Ancienne Valeur (Old Value)
                  </div>
                  {selectedLog.oldValue ? (
                    <pre className="text-[11px] text-slate-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto max-h-48 font-mono">
                      {JSON.stringify(selectedLog.oldValue, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-slate-500 italic text-[11px] p-2">Aucune donnée antérieure (Création)</div>
                  )}
                </div>

                {/* New Value */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Nouvelle Valeur (New Value)
                  </div>
                  {selectedLog.newValue ? (
                    <pre className="text-[11px] text-slate-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto max-h-48 font-mono">
                      {JSON.stringify(selectedLog.newValue, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-slate-500 italic text-[11px] p-2">Élément supprimé (null)</div>
                  )}
                </div>
              </div>

              {/* Security confirmation badge */}
              <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                🔒 Données protégées — Tous les mots de passe et jetons d'accès sont exclus des journaux d'audit.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-850 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
