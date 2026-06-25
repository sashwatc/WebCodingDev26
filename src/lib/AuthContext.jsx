import React, { createContext, useContext, useEffect, useState } from "react";
import { appClient } from "@/api/appClient";
import { queryClientInstance } from "@/lib/query-client";

const AuthContext = createContext();

function isBackendAdmin(user) {
  return String(user?.role || "").toLowerCase() === "admin";
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAdminAccessOpen, setIsAdminAccessOpen] = useState(false);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await appClient.auth.completeOAuthRedirect?.();
      } catch {
        // Ignore: a failed OAuth completion falls back to the unauthenticated state.
      }
      await checkAppState();
    })();

    const {
      data: { subscription },
    } = appClient.auth.onAuthStateChange(() => {
      setTimeout(() => {
        queryClientInstance.clear();
        void checkAppState();
      }, 0);
    });

    const handleStorage = () => {
      queryClientInstance.clear();
      void checkAppState();
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const currentUser = await appClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(Boolean(currentUser));
      setHasAdminAccess(isBackendAdmin(currentUser));
      setAppPublicSettings({
        id: "standalone",
        public_settings: {
          mode: "standalone",
        },
      });
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setHasAdminAccess(false);
      setAuthError({
        type: "unknown",
        message: error.message || "Failed to load the app",
      });
    } finally {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    setHasAdminAccess(false);
    setIsAdminAccessOpen(false);
    await appClient.auth.logout(window.location.href);
  };

  const signIn = async (credentials) => {
    const nextUser = await appClient.auth.signIn(credentials);
    setHasAdminAccess(isBackendAdmin(nextUser));
    setIsAdminAccessOpen(false);
    setIsSignInOpen(false);
    return nextUser;
  };

  const signInWithGoogle = async () => {
    return appClient.auth.signInWithGoogle();
  };

  const isAppwriteEnabled = Boolean(appClient.auth.isAppwriteEnabled?.());

  const navigateToLogin = async () => {
    setIsSignInOpen(true);
    return null;
  };

  const openAdminAccess = async () => {
    if (!user) {
      setIsSignInOpen(true);
      return false;
    }

    if (!isBackendAdmin(user)) {
      setIsAdminAccessOpen(true);
      return false;
    }

    setHasAdminAccess(true);
    setIsAdminAccessOpen(false);
    return true;
  };

  const requestAdminAccess = async () => {
    if (!user) {
      throw new Error("Sign in before opening admin controls.");
    }

    if (!isBackendAdmin(user)) {
      throw new Error("This account does not have admin access.");
    }

    setHasAdminAccess(true);
    setIsAdminAccessOpen(false);
    return true;
  };

  const revokeAdminAccess = () => {
    setHasAdminAccess(false);
    setIsAdminAccessOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hasAdminAccess,
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
        requestAdminAccess,
        revokeAdminAccess,
        checkAppState,
        isSignInOpen,
        setIsSignInOpen,
        isAdminAccessOpen,
        setIsAdminAccessOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
