import React, { createContext, useContext, useEffect, useState } from "react";
import { appClient } from "@/api/appClient";
import { queryClientInstance } from "@/lib/query-client";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

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
      setAppPublicSettings({
        id: "standalone",
        public_settings: {
          mode: "standalone",
        },
      });
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
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
    await appClient.auth.logout(window.location.href);
  };

  const signIn = async (credentials) => {
    const nextUser = await appClient.auth.signIn(credentials);
    setIsSignInOpen(false);
    return nextUser;
  };

  const navigateToLogin = async () => {
    setIsSignInOpen(true);
    return null;
  };

  const isAdminUser = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdminUser,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        signIn,
        navigateToLogin,
        checkAppState,
        isSignInOpen,
        setIsSignInOpen,
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
