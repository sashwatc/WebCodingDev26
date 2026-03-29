import React, { createContext, useContext, useEffect, useState } from "react";
import { appClient } from "@/api/appClient";
import { queryClientInstance } from "@/lib/query-client";
import { ADMIN_ACCESS_PASSWORD } from "@/lib/constants";

const AuthContext = createContext();
const ADMIN_ACCESS_STORAGE_KEY = "findback-admin-access";

function readAdminAccess() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(ADMIN_ACCESS_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeAdminAccess(nextValue) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (nextValue) {
      window.localStorage.setItem(ADMIN_ACCESS_STORAGE_KEY, "true");
      return;
    }

    window.localStorage.removeItem(ADMIN_ACCESS_STORAGE_KEY);
  } catch {
    // Ignore storage write failures in restricted browser contexts.
  }
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
  const [hasAdminAccess, setHasAdminAccess] = useState(readAdminAccess);

  useEffect(() => {
    void checkAppState();

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
      setHasAdminAccess(Boolean(currentUser) && readAdminAccess());
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
    writeAdminAccess(false);
    setHasAdminAccess(false);
    setIsAdminAccessOpen(false);
    await appClient.auth.logout(window.location.href);
  };

  const signIn = async (credentials) => {
    const nextUser = await appClient.auth.signIn(credentials);
    writeAdminAccess(false);
    setHasAdminAccess(false);
    setIsAdminAccessOpen(false);
    setIsSignInOpen(false);
    return nextUser;
  };

  const navigateToLogin = async () => {
    setIsSignInOpen(true);
    return null;
  };

  const openAdminAccess = async () => {
    if (!user) {
      setIsSignInOpen(true);
      return false;
    }

    setIsAdminAccessOpen(true);
    return true;
  };

  const requestAdminAccess = async (password) => {
    if (!user) {
      throw new Error("Sign in before opening admin controls.");
    }

    if (String(password || "").trim() !== ADMIN_ACCESS_PASSWORD) {
      throw new Error("Incorrect admin password.");
    }

    writeAdminAccess(true);
    setHasAdminAccess(true);
    setIsAdminAccessOpen(false);
    return true;
  };

  const revokeAdminAccess = () => {
    writeAdminAccess(false);
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
