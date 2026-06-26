import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appClient } from "@/api/appClient";
import { queryClientInstance } from "@/lib/query-client";
import { clearClientAuthStorage, isAdminRole, isStaffRole, isStudentRole } from "@/lib/auth-session";
import { stripLegacyAdminModeFromUiSettings } from "@/lib/auth-role";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [signInMode, setSignInMode] = useState("signin"); // "signin" | "register"
  const [isAdminAccessOpen, setIsAdminAccessOpen] = useState(false);

  const isAdmin = useMemo(() => isAdminRole(user), [user]);
  const isStaff = useMemo(() => isStaffRole(user), [user]);
  const isStudent = useMemo(() => isStudentRole(user), [user]);

  useEffect(() => {
    stripLegacyAdminModeFromUiSettings();

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

  const applyAuthUser = (currentUser) => {
    setUser(currentUser);
    setIsAuthenticated(Boolean(currentUser));
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const currentUser = await appClient.auth.me();
      applyAuthUser(currentUser);
      setAppPublicSettings({
        id: "standalone",
        public_settings: {
          mode: "standalone",
        },
      });
    } catch (error) {
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

  const logout = async (returnUrl = window.location.href) => {
    setIsAdminAccessOpen(false);
    applyAuthUser(null);
    clearClientAuthStorage();
    await appClient.auth.logout(returnUrl);
    queryClientInstance.clear();
  };

  const signIn = async (credentials) => {
    const nextUser = await appClient.auth.signIn(credentials);
    applyAuthUser(nextUser);
    setIsSignInOpen(false);
    setIsAdminAccessOpen(false);
    queryClientInstance.clear();
    return nextUser;
  };

  const signInWithGoogle = async () => appClient.auth.signInWithGoogle();

  const isAppwriteEnabled = Boolean(appClient.auth.isAppwriteEnabled?.());

  const navigateToLogin = async () => {
    setSignInMode("signin");
    setIsSignInOpen(true);
    return null;
  };

  const openSignIn = () => { setSignInMode("signin"); setIsSignInOpen(true); };
  const openRegister = () => { setSignInMode("register"); setIsSignInOpen(true); };

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isStaff,
        isStudent,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
