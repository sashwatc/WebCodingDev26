/**
 * Lost Then Found - Application Router
 * Defines all routes and wraps pages in the appropriate layouts.
 * Public pages use PublicLayout (Navbar + Footer).
 *
 * This file is the top of the React component tree below main.jsx. It is
 * responsible for:
 *   - Installing the app-wide providers (auth, data-fetching cache, animation
 *     config) in the right nesting order.
 *   - Declaring every client-side route and which guard/layout wraps it.
 *   - Showing a global loading / auth-error gate before any page renders.
 * A reader who only reads the comments should come away knowing which URL maps
 * to which page, and which pages require a signed-in user vs. an admin.
 */

// --- Third-party + shared infrastructure imports ---
import { Toaster } from "@/components/ui/toaster" // Global toast/notification renderer (portal at app root).
import { QueryClientProvider } from '@tanstack/react-query' // Provides the React Query cache to all hooks below.
import { queryClientInstance } from '@/lib/query-client' // The single shared React Query client instance.
import { useTranslation } from "react-i18next"; // i18n hook used here for the loading message.
import React from 'react'; // Needed for React.useEffect below.
import { HashRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom'; // Hash-based routing (URLs look like /#/Home), so no server rewrite config is required.
import { MotionConfig } from "framer-motion"; // App-wide Framer Motion configuration (respects reduced-motion).
import PageNotFound from './lib/PageNotFound'; // 404 page rendered for unmatched routes.
import { AuthProvider, useAuth } from '@/lib/AuthContext'; // Auth context provider + hook (current user, loading state, admin flag).
import UserNotRegisteredError from '@/components/UserNotRegisteredError'; // Shown when a session exists but the user isn't registered.
import AdminRouteGuard from '@/components/auth/AdminRouteGuard'; // Wrapper that blocks non-admins from a route.
import AuthRouteGuard from '@/components/auth/AuthRouteGuard'; // Wrapper that requires any signed-in user for a route.
import SignInDialog from '@/components/auth/SignInDialog'; // Global modal that prompts sign-in when triggered.
import AdminAccessDialog from '@/components/auth/AdminAccessDialog'; // Global modal for elevating to admin access.
import RouteEnhancements from '@/components/layout/RouteEnhancements'; // Cross-route side effects (e.g. scroll restoration, title updates).
import { BRAND_NAME } from '@/lib/constants'; // Display name of the product, used in the loading message.

// Layout
import PublicLayout from '@/components/layout/PublicLayout'; // Shared chrome (Navbar + Footer) wrapped around public pages via an Outlet.

// Page imports - each maps to a top-level route declared in <Routes> below.
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
import Settings from '@/pages/Settings';
import SupportWidget from '@/components/support/SupportWidget';

// Inner app shell that runs INSIDE the Router and AuthProvider, so it can read
// auth state and use navigation hooks. It owns the global loading gate, the
// auth-error gate, and the full route table.
const AuthenticatedApp = () => {
  const { t } = useTranslation(); // Translator for the loading copy.
  // Pull auth/session state from context: loading flags, any auth error, a
  // helper to redirect to login, the current user, and whether they're admin.
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  // Once auth has loaded and a user is present, auto-redirect them away from the
  // public "lobby" (root / Home) into their role-appropriate dashboard.
  React.useEffect(() => {
    if (user && !isLoadingAuth) {
      const hash = window.location.hash;
      // Treat empty hash, "#/", and "#/Home" as the lobby landing spot.
      const isLobby = !hash || hash === "#/" || hash === "#/Home";
      // Admins land on the admin dashboard, everyone else on the user dashboard.
      if (isLobby) navigate(isAdmin ? "/AdminDashboard" : "/UserDashboard");
    }
  }, [user?.id, isLoadingAuth]); // Re-run only when the user identity or auth-loading state changes.

  // Gate 1: while public settings or auth are still loading, show a centered
  // spinner instead of rendering any route (prevents UI flicker/flash of guards).
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

  // Gate 2: handle hard auth errors before rendering routes.
  if (authError) {
    // A valid session whose account isn't registered: show a dedicated screen.
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // A protected context requires login: bounce to the login flow, render nothing.
      navigateToLogin();
      return null;
    }
  }

  return (
    // Fragment groups the cross-route side-effect component with the route table.
    <>
      {/* Runs route-change side effects (scroll reset, document title, etc.). */}
      <RouteEnhancements />
      {/* The single <Routes> switch: only the first matching <Route> renders. */}
      <Routes>
        {/* Redirect root "/" to the Home page so there is always a landing route. */}
        <Route path="/" element={<Navigate to="/Home" replace />} />

        {/*
          Layout route: every nested route renders inside <PublicLayout />'s
          <Outlet/>, so all of these pages share the Navbar + Footer chrome.
          Guard wrappers determine access:
            - no wrapper            => fully public page
            - <AuthRouteGuard>      => requires any signed-in user
            - <AdminRouteGuard>     => requires an admin user
        */}
        <Route element={<PublicLayout />}>
          <Route path="/Home" element={<Home />} /> {/* Public landing page. */}
          <Route path="/Search" element={<AuthRouteGuard><Search /></AuthRouteGuard>} /> {/* Search the found-item inventory (auth required). */}
          <Route path="/LostItems" element={<AuthRouteGuard><LostItems /></AuthRouteGuard>} /> {/* Browse lost reports (auth required). */}
          <Route path="/ReportFound" element={<AuthRouteGuard><ReportFound /></AuthRouteGuard>} /> {/* Submit a found-item intake (auth required). */}
          <Route path="/ReportLost" element={<AuthRouteGuard><ReportLost /></AuthRouteGuard>} /> {/* File a lost report (auth required). */}
          <Route path="/ItemDetails" element={<AuthRouteGuard><ItemDetails /></AuthRouteGuard>} /> {/* Single found-item detail view (auth required; id via query string). */}
          <Route path="/ClaimItem" element={<AuthRouteGuard><ClaimItem /></AuthRouteGuard>} /> {/* Start/submit a claim on a found item (auth required). */}
          <Route path="/UserDashboard" element={<AuthRouteGuard><UserDashboard /></AuthRouteGuard>} /> {/* The signed-in user's reports/claims/notifications hub. */}
          {/* Admin-only operations console; AdminRouteGuard blocks non-admins. */}
          <Route
            path="/AdminDashboard"
            element={(
              <AdminRouteGuard>
                <AdminDashboard />
              </AdminRouteGuard>
            )}
          />
          <Route path="/About" element={<About />} /> {/* Static marketing/info page. */}
          <Route path="/FAQ" element={<FAQ />} /> {/* Frequently asked questions. */}
          <Route path="/Privacy" element={<Privacy />} /> {/* Privacy policy. */}
          <Route path="/Terms" element={<Terms />} /> {/* Terms of service. */}
          <Route path="/Accessibility" element={<Accessibility />} /> {/* Accessibility statement. */}
          <Route path="/Sources" element={<Sources />} /> {/* Credits/sources page. */}
          <Route path="/Documentation" element={<Documentation />} /> {/* In-app documentation. */}
          <Route path="/ShaderDemo" element={<ShaderDemo />} /> {/* Visual/shader demo page. */}
          <Route path="/EventHub" element={<EventHub />} /> {/* Event recovery hub landing (public). */}
          <Route path="/Beacon" element={<Beacon />} /> {/* Beacon feature page (public). */}
          <Route path="/Display" element={<Display />} /> {/* Public display/kiosk feed page. */}
          <Route path="/PickupPass" element={<AuthRouteGuard><PickupPass /></AuthRouteGuard>} /> {/* Claimant's return-pass / pickup view (auth required). */}
          <Route path="/Support" element={<Support />} /> {/* Support / contact page (public). */}
          <Route path="/Settings" element={<AuthRouteGuard><Settings /></AuthRouteGuard>} /> {/* Account + notification settings (auth required). */}
          {/* Admin-only station UI for verifying/redeeming pickups. */}
          <Route
            path="/PickupStation"
            element={(
              <AdminRouteGuard>
                <PickupStation />
              </AdminRouteGuard>
            )}
          />
        </Route>

        {/* Catch-all: any path not matched above renders the 404 page. */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

// Root component. Establishes the provider nesting order (outermost first):
//   AuthProvider          -> exposes auth/session state to everything.
//     QueryClientProvider -> shares the React Query cache for data fetching.
//       MotionConfig      -> global animation defaults (honor OS reduced-motion).
//         Router          -> hash router that renders the route table.
// Global singletons (dialogs, support widget, toaster) live alongside the router
// so they can appear over any route.
function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        {/* reducedMotion="user" disables animations when the OS prefers reduced motion. */}
        <MotionConfig reducedMotion="user">
          {/* App-wide modals mounted once, opened on demand from anywhere via context. */}
          <SignInDialog />
          <AdminAccessDialog />
          {/* future flags opt into React Router v7 behavior early (concurrent transitions + relative splat paths). */}
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {/* The route table + loading/auth gates. */}
            <AuthenticatedApp />
            {/* Floating support/help widget available on every route. */}
            <SupportWidget />
          </Router>
        </MotionConfig>
        {/* Toast portal; lives under the query provider so toasts can use cache data. */}
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
