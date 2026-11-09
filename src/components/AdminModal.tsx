import React, { useState, useEffect } from 'react';
import { AuthUser, SubmittedQuote } from '../types';
import { apiService } from '../services/api';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotes?: SubmittedQuote[];
  onUpdateStatus?: (id: string, newStatus: SubmittedQuote['status']) => void;
  onDeleteQuote?: (id: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

  // Check existing session token on open
  useEffect(() => {
    if (!isOpen) return;

    const checkAuth = async () => {
      setIsVerifying(true);
      try {
        const res = await apiService.getCurrentUser();
        if (res.success && res.user) {
          setCurrentUser(res.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setIsVerifying(false);
      }
    };

    checkAuth();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex flex-col justify-start">
      {isVerifying ? (
        <div className="min-h-screen flex items-center justify-center text-white text-sm font-bold">
          <div className="flex items-center gap-3 bg-slate-900 px-6 py-4 rounded-2xl border border-slate-800 shadow-2xl">
            <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            Vérification des droits d'accès sécurisés...
          </div>
        </div>
      ) : currentUser ? (
        <AdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          onBackToSite={onClose}
        />
      ) : (
        <AdminLogin
          onLoginSuccess={(user) => setCurrentUser(user)}
          onBackToSite={onClose}
        />
      )}
    </div>
  );
};
