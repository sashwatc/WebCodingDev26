import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function AuthRouteGuard({ children }) {
  const { isLoadingAuth, isAuthenticated, isSuspended, openSignIn } = useAuth();

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

  if (isSuspended) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground">Account Suspended</h2>
          <p className="text-sm text-muted-foreground">Your account has been suspended. Contact school staff if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return children;
}
