import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  AlertCircle,
  ArrowLeft,
  KeyRound,
  Info,
} from 'lucide-react';
import { apiService } from '../services/api';
import { AuthUser } from '../types';
import { COMPANY_SETTINGS } from '../config/companySettings';

interface AdminLoginProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToSite }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await apiService.login(username, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Identifiants invalides. Veuillez réessayer.');
      }
    } catch {
      setError('Erreur de communication avec le serveur d’authentification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Top banner */}
        <div className="bg-blue-900 text-white p-8 text-center relative">
          <button
            type="button"
            onClick={onBackToSite}
            className="absolute left-4 top-4 p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au site
          </button>

          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
            <ShieldCheck className="w-9 h-9 text-amber-400" />
          </div>

          <h1 className="text-xl font-black tracking-tight">{COMPANY_SETTINGS.company_name}</h1>
          <p className="text-xs text-blue-200 mt-1 uppercase tracking-widest font-bold">
            Portail d'Administration Sécurisé
          </p>
        </div>

        {/* Login form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Nom d'utilisateur ou Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="admin-login-username"
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Mot de passe sécurisé
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  id="admin-login-password"
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-900 text-slate-900 text-sm font-medium"
                />
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm py-3.5 rounded-xl shadow-md shadow-blue-900/20 transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Vérification sécurisée...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Se connecter à l'espace Admin
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50 rounded-xl p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-blue-900" />
              Accès Restreint & Sécurisé
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cet espace est strictement réservé au personnel autorisé de {COMPANY_SETTINGS.company_name}.
              Toutes les connexions sont chiffrées (JWT, Bcrypt) et les tentatives d'accès font l'objet d'un audit de sécurité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
