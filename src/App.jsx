/**
 * Lost Then Found - Application Router
 * Defines all routes and wraps pages in the appropriate layouts.
 * Public pages use PublicLayout (Navbar + Footer).
 */

import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { useTranslation } from "react-i18next";
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { MotionConfig } from "framer-motion";
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
import AuthRouteGuard from '@/components/auth/AuthRouteGuard';
import StaffRouteGuard from '@/components/auth/StaffRouteGuard';
import SignInDialog from '@/components/auth/SignInDialog';
import AdminAccessDialog from '@/components/auth/AdminAccessDialog';
import RouteEnhancements from '@/components/layout/RouteEnhancements';
import { BRAND_NAME } from '@/lib/constants';

// Layout
import PublicLayout from '@/components/layout/PublicLayout';

// Page imports
import Home from '@/pages/Home';
import Search from '@/pages/Search';
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
import PickupPass from '@/pages/PickupPass';
import PickupStation from '@/pages/PickupStation';
import Settings from '@/pages/Settings';

const AuthenticatedApp = () => {
  const { t } = useTranslation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
          <Route path="/Search" element={<Search />} />
          <Route path="/ReportFound" element={<AuthRouteGuard><ReportFound /></AuthRouteGuard>} />
          <Route path="/ReportLost" element={<AuthRouteGuard><ReportLost /></AuthRouteGuard>} />
          <Route path="/ItemDetails" element={<ItemDetails />} />
          <Route path="/ClaimItem" element={<AuthRouteGuard><ClaimItem /></AuthRouteGuard>} />
          <Route path="/UserDashboard" element={<AuthRouteGuard><UserDashboard /></AuthRouteGuard>} />
          <Route
            path="/AdminDashboard"
            element={(
              <StaffRouteGuard>
                <AdminDashboard />
              </StaffRouteGuard>
            )}
          />
          <Route path="/About" element={<About />} />
          <Route path="/FAQ" element={<FAQ />} />
          <Route path="/Privacy" element={<Privacy />} />
          <Route path="/Terms" element={<Terms />} />
          <Route path="/Accessibility" element={<Accessibility />} />
          <Route path="/Sources" element={<Sources />} />
          <Route path="/Documentation" element={<Documentation />} />
          <Route path="/PickupPass" element={<AuthRouteGuard><PickupPass /></AuthRouteGuard>} />
          <Route path="/Settings" element={<AuthRouteGuard><Settings /></AuthRouteGuard>} />
          <Route
            path="/PickupStation"
            element={(
              <StaffRouteGuard>
                <PickupStation />
              </StaffRouteGuard>
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
