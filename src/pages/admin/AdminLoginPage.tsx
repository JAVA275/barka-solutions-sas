import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AdminLogin } from '../../components/AdminLogin';
import { apiService } from '../../services/api';
import { AuthUser } from '../../types';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const res = await apiService.getCurrentUser();
        if (isMounted) {
          if (res.success && res.user) {
            setCurrentUser(res.user);
          } else {
            setCurrentUser(null);
          }
        }
      } catch {
        if (isMounted) setCurrentUser(null);
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm font-bold">
        <div className="flex items-center gap-3 bg-slate-800 px-6 py-4 rounded-2xl border border-slate-700 shadow-2xl">
          <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          Vérification des droits d'accès sécurisés...
        </div>
      </div>
    );
  }

  // If already logged in, redirect to destination or dashboard
  if (currentUser) {
    const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={fromPath || '/admin/dashboard'} replace />;
  }

  const handleLoginSuccess = (_user: AuthUser) => {
    const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(fromPath || '/admin/dashboard', { replace: true });
  };

  const handleBackToSite = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center">
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToSite={handleBackToSite}
      />
    </div>
  );
};
