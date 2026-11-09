import React, { useState, useEffect } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AdminDashboard, AdminTab } from '../AdminDashboard';
import { apiService } from '../../services/api';
import { AuthUser } from '../../types';

interface AdminProtectedRouteProps {
  tab?: AdminTab;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ tab = 'stats' }) => {
  const location = useLocation();
  const navigate = useNavigate();

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

  // Not authenticated: redirect to /admin/login preserving intended route in state
  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    await apiService.logout();
    setCurrentUser(null);
    navigate('/admin/login', { replace: true });
  };

  const handleBackToSite = () => {
    navigate('/');
  };

  return (
    <AdminDashboard
      currentUser={currentUser}
      initialTab={tab}
      onLogout={handleLogout}
      onBackToSite={handleBackToSite}
    />
  );
};
