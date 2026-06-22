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
import { ModeProvider } from '@/lib/ModeContext';
import AdminRouteGuard from '@/components/auth/AdminRouteGuard';
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

const AuthenticatedApp = () => {
  const { t } = useTranslation();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[hsl(210,20%,98%)]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[hsl(174,60%,40%)] rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-400">{t("common.loading")} {BRAND_NAME}</p>
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
          <Route path="/LostItems" element={<LostItems />} />
          <Route path="/ReportFound" element={<ReportFound />} />
          <Route path="/ReportLost" element={<ReportLost />} />
          <Route path="/ItemDetails" element={<ItemDetails />} />
          <Route path="/ClaimItem" element={<ClaimItem />} />
          <Route path="/UserDashboard" element={<UserDashboard />} />
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
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <ModeProvider>
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
    </ModeProvider>
  )
}

export default App
