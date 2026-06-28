/**
 * AuthContext.jsx
 * -----------------------------------------------------------------------------
 * Central authentication/session React context for the app.
 *
 * Responsibilities:
 *  - Holds the current authenticated user object and derived role booleans
 *    (isAdmin / isStaff / isStudent / isSuspended).
 *  - Tracks loading + error state while the session is being resolved.
 *  - Exposes auth actions (signIn, signInWithGoogle, logout, checkAppState).
 *  - Owns UI state for the global sign-in modal and the admin-access prompt.
 *  - Listens for auth state changes (from the auth client) and cross-tab
 *    `storage` events, re-checking the session and clearing cached queries.
 *
 * Consumers use the `useAuth()` hook (defined at the bottom) to read any of the
 * values provided on the context. The provider must wrap any tree that calls it.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appClient } from "@/api/appClient";
import { queryClientInstance } from "@/lib/query-client";
import { clearClientAuthStorage, isAdminRole, isStaffRole, isStudentRole, isSuspendedRole } from "@/lib/auth-session";
import { stripLegacyAdminModeFromUiSettings } from "@/lib/auth-role";

// The context object itself; default `undefined` so `useAuth` can detect when a
// consumer is rendered outside of an <AuthProvider>.
const AuthContext = createContext();

// Provider component: wrap the app (or any subtree that needs auth) with this.
export const AuthProvider = ({ children }) => {
  // --- Core session state ---
  const [user, setUser] = useState(null);                 // Current user object, or null when signed out.
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Convenience boolean mirror of `user != null`.
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);      // True while resolving the session on mount / refresh.
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true); // True while app public settings load.
  const [authError, setAuthError] = useState(null);             // Holds { type, message } when session resolution fails.
  const [appPublicSettings, setAppPublicSettings] = useState(null); // App-level public config (mode, etc.).

  // --- Sign-in / admin modal UI state ---
  const [isSignInOpen, setIsSignInOpen] = useState(false);      // Whether the global sign-in modal is visible.
  const [signInMode, setSignInMode] = useState("signin"); // "signin" | "register" — which tab the modal opens on.
  const [isAdminAccessOpen, setIsAdminAccessOpen] = useState(false); // Whether the "needs admin access" prompt is shown.

  // Derived role flags, memoized so they only recompute when `user` changes.
  const isAdmin = useMemo(() => isAdminRole(user), [user]);
  const isStaff = useMemo(() => isStaffRole(user), [user]);
  const isStudent = useMemo(() => isStudentRole(user), [user]);
  const isSuspended = useMemo(() => isSuspendedRole(user), [user]);

  // On mount: clean up legacy storage, complete any pending OAuth redirect,
  // resolve the current session, and subscribe to auth + cross-tab changes.
  useEffect(() => {
    // Remove the deprecated `isAdminMode` flag from persisted UI settings.
    stripLegacyAdminModeFromUiSettings();

    void (async () => {
      try {
        // If we just returned from an OAuth provider, finish that handshake.
        await appClient.auth.completeOAuthRedirect?.();
      } catch {
        // Ignore: a failed OAuth completion falls back to the unauthenticated state.
      }
      await checkAppState();
    })();

    // Re-resolve the session whenever the auth client reports a state change
    // (login/logout/token refresh). Deferred via setTimeout so it runs after
    // the current call stack, and the query cache is cleared to avoid stale data.
    const {
      data: { subscription },
    } = appClient.auth.onAuthStateChange(() => {
      setTimeout(() => {
        queryClientInstance.clear();
        void checkAppState();
      }, 0);
    });

    // Sync auth across browser tabs: a `storage` event means another tab changed
    // the persisted session, so re-check here too.
    const handleStorage = () => {
      queryClientInstance.clear();
      void checkAppState();
    };
    window.addEventListener("storage", handleStorage);

    // Cleanup: drop subscriptions/listeners when the provider unmounts.
    return () => {
      subscription?.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Apply a resolved user to state and keep `isAuthenticated` in sync.
  const applyAuthUser = (currentUser) => {
    setUser(currentUser);
    setIsAuthenticated(Boolean(currentUser));
  };

  // Resolve the current session from the backend (`auth.me`) and load app
  // public settings. Sets loading flags around the request and records an
  // error (and clears the user) if it fails.
  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const currentUser = await appClient.auth.me();
      applyAuthUser(currentUser);
      // This build runs in "standalone" mode; public settings are hard-coded.
      setAppPublicSettings({
        id: "standalone",
        public_settings: {
          mode: "standalone",
        },
      });
    } catch (error) {
      // On failure, treat the user as signed out and surface the error.
      applyAuthUser(null);
      setAuthError({
        type: "unknown",
        message: error.message || "Failed to load the app",
      });
    } finally {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  // Sign the user out: close admin prompt, clear local state + stored auth,
  // call the backend logout (which may redirect back to `returnUrl`), then
  // wipe the query cache.
  const logout = async (returnUrl = window.location.href) => {
    setIsAdminAccessOpen(false);
    applyAuthUser(null);
    clearClientAuthStorage();
    await appClient.auth.logout(returnUrl);
    queryClientInstance.clear();
  };

  // Email/password (or demo) sign-in. On success applies the user, closes any
  // open modals, clears cached queries, and returns the signed-in user.
  const signIn = async (credentials) => {
    const nextUser = await appClient.auth.signIn(credentials);
    applyAuthUser(nextUser);
    setIsSignInOpen(false);
    setIsAdminAccessOpen(false);
    queryClientInstance.clear();
    return nextUser;
  };

  // Kick off the Google OAuth flow (redirect handled by the auth client).
  const signInWithGoogle = async () => appClient.auth.signInWithGoogle();

  // Whether Appwrite-backed auth is configured/enabled in this build.
  const isAppwriteEnabled = Boolean(appClient.auth.isAppwriteEnabled?.());

  // Open the sign-in modal in "signin" mode (used where a login is required).
  const navigateToLogin = async () => {
    setSignInMode("signin");
    setIsSignInOpen(true);
    return null;
  };

  // Convenience openers that set the modal tab before showing it.
  const openSignIn = () => { setSignInMode("signin"); setIsSignInOpen(true); };
  const openRegister = () => { setSignInMode("register"); setIsSignInOpen(true); };

  // Gate access to admin areas. Returns true only when the current user is an
  // admin; otherwise it opens the appropriate prompt (sign-in if logged out,
  // admin-access notice if logged in without the admin role) and returns false.
  const openAdminAccess = async () => {
    if (!user) {
      setIsSignInOpen(true);
      return false;
    }

    if (!isAdminRole(user)) {
      setIsAdminAccessOpen(true);
      return false;
    }

    setIsAdminAccessOpen(false);
    return true;
  };

  // Expose state + actions to the tree. `hasAdminAccess` mirrors `isAdmin`.
  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isStaff,
        isStudent,
        isSuspended,
        hasAdminAccess: isAdmin,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        signIn,
        signInWithGoogle,
        isAppwriteEnabled,
        navigateToLogin,
        openAdminAccess,
        checkAppState,
        isSignInOpen,
        setIsSignInOpen,
        signInMode,
        openSignIn,
        openRegister,
        isAdminAccessOpen,
        setIsAdminAccessOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Consumer hook: returns the auth context value. Throws if used outside of an
// <AuthProvider> so misuse fails loudly instead of returning undefined.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
