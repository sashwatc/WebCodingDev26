/**
 * Lost Then Found - Application Router
 * Defines all routes and wraps pages in the appropriate layouts.
 * Public pages use PublicLayout (Navbar + Footer).
 */

import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useTranslation } from "react-i18next";
import React from 'react';
import { HashRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { MotionConfig } from "framer-motion";
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import AuthRouteGuard from '@/components/auth/AuthRouteGuard';
import SignInDialog from '@/components/auth/SignInDialog';
import AdminAccessDialog from '@/components/auth/AdminAccessDialog';
import RouteEnhancements from '@/components/layout/RouteEnhancements';
import { BRAND_NAME } from '@/lib/constants';

// Layout
import PublicLayout from '@/components/layout/PublicLayout';

// Page imports
import Home from '@/pages/Home';
import Search from '@/pages/Search';
import LostItems from '@/pages/LostItems';
import ReportFound from '@/pages/ReportFound';
import ReportLost from '@/pages/ReportLost';
import ItemDetails from '@/pages/ItemDetails';
import ClaimItem from '@/pages/ClaimItem';
import UserDashboard from '@/pages/UserDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import About from '@/pages/About';
import FAQ from '@/pages/FAQ';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Accessibility from '@/pages/Accessibility';
import Sources from '@/pages/Sources';
import Documentation from '@/pages/Documentation';
import ShaderDemo from '@/pages/ShaderDemo';
import EventHub from '@/pages/EventHub';
import Beacon from '@/pages/Beacon';
import Display from '@/pages/Display';
import PickupPass from '@/pages/PickupPass';
import PickupStation from '@/pages/PickupStation';
import Support from '@/pages/Support';

const AuthenticatedApp = () => {
  const { t } = useTranslation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  React.useEffect(() => {
    if (user && !isLoadingAuth) {
      const hash = window.location.hash;
      const isLobby = !hash || hash === "#/" || hash === "#/Home";
      if (isLobby) navigate(isAdmin ? "/AdminDashboard" : "/UserDashboard");
    }
  }, [user?.id, isLoadingAuth]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
          <p className="text-sm text-muted-foreground">{t("common.loading")} {BRAND_NAME}</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      <RouteEnhancements />
      <Routes>
        {/* Redirect root to Home */}
        <Route path="/" element={<Navigate to="/Home" replace />} />

        {/* Public pages with layout (Navbar + Footer) */}
        <Route element={<PublicLayout />}>
          <Route path="/Home" element={<Home />} />
          <Route path="/Search" element={<AuthRouteGuard><Search /></AuthRouteGuard>} />
          <Route path="/LostItems" element={<AuthRouteGuard><LostItems /></AuthRouteGuard>} />
          <Route path="/ReportFound" element={<AuthRouteGuard><ReportFound /></AuthRouteGuard>} />
          <Route path="/ReportLost" element={<AuthRouteGuard><ReportLost /></AuthRouteGuard>} />
          <Route path="/ItemDetails" element={<AuthRouteGuard><ItemDetails /></AuthRouteGuard>} />
          <Route path="/ClaimItem" element={<AuthRouteGuard><ClaimItem /></AuthRouteGuard>} />
          <Route path="/UserDashboard" element={<AuthRouteGuard><UserDashboard /></AuthRouteGuard>} />
          <Route
            path="/AdminDashboard"
            element={(
              <AdminRouteGuard>
                <AdminDashboard />
              </AdminRouteGuard>
            )}
          />
          <Route path="/About" element={<About />} />
          <Route path="/FAQ" element={<FAQ />} />
          <Route path="/Privacy" element={<Privacy />} />
          <Route path="/Terms" element={<Terms />} />
          <Route path="/Accessibility" element={<Accessibility />} />
          <Route path="/Sources" element={<Sources />} />
          <Route path="/Documentation" element={<Documentation />} />
          <Route path="/ShaderDemo" element={<ShaderDemo />} />
          <Route path="/EventHub" element={<EventHub />} />
          <Route path="/Beacon" element={<Beacon />} />
          <Route path="/Display" element={<Display />} />
          <Route path="/PickupPass" element={<AuthRouteGuard><PickupPass /></AuthRouteGuard>} />
          <Route path="/Support" element={<Support />} />
          <Route
            path="/PickupStation"
            element={(
              <AdminRouteGuard>
                <PickupStation />
              </AdminRouteGuard>
            )}
          />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <MotionConfig reducedMotion="user">
          <SignInDialog />
          <AdminAccessDialog />
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthenticatedApp />
          </Router>
        </MotionConfig>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
