/**
 * BARKA SOLUTIONS S.A.S - Application Vitrine & Plateforme de Devis
 * Ngaoundéré, Cameroun
 * 
 * Routage URL professionnel avec React Router
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from './components/PublicLayout';
import { ScrollToTop } from './components/ScrollToTop';

import { HomePage } from './pages/HomePage';
import { ServicesPage } from './pages/ServicesPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { PricesPage } from './pages/PricesPage';
import { QuotePage } from './pages/QuotePage';
import { ContactPage } from './pages/ContactPage';
import { AboutPage } from './pages/AboutPage';

import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Navigation Publique avec Header, BottomNav, Footer & Drawer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServicesPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/portfolio/:id" element={<PortfolioPage />} />
          <Route path="/tarifs" element={<PricesPage />} />
          <Route path="/devis" element={<QuotePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/apropos" element={<Navigate to="/a-propos" replace />} />
        </Route>

        {/* Administration Sécurisée */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminProtectedRoute tab="stats" />} />
        <Route path="/admin/devis" element={<AdminProtectedRoute tab="quotes" />} />
        <Route path="/admin/services" element={<AdminProtectedRoute tab="services" />} />
        <Route path="/admin/portfolio" element={<AdminProtectedRoute tab="portfolio" />} />
        <Route path="/admin/tarifs" element={<AdminProtectedRoute tab="tarifs" />} />
        <Route path="/admin/parametres" element={<AdminProtectedRoute tab="settings" />} />
        <Route path="/admin/messages" element={<AdminProtectedRoute tab="messages" />} />
        <Route path="/admin/users" element={<AdminProtectedRoute tab="users" />} />
        <Route path="/admin/audit" element={<AdminProtectedRoute tab="audit" />} />
        <Route path="/admin/logs" element={<Navigate to="/admin/audit" replace />} />

        {/* Redirection des routes inconnues vers l'accueil */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
