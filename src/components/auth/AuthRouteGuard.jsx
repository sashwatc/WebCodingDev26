import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function AuthRouteGuard({ children }) {
  const { isLoadingAuth, isAuthenticated, openSignIn } = useAuth();

  // Open the sign-in dialog once when an unauthenticated user hits a guarded
  // route. Doing this in an effect (not during render) avoids re-forcing the
  // dialog open on every render, which would make its close button appear dead.
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      openSignIn();
    }
  }, [isLoadingAuth, isAuthenticated, openSignIn]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Send them to a real page so closing the dialog doesn't re-trigger the guard.
    return <Navigate to="/Home" replace />;
  }

  return children;
}
