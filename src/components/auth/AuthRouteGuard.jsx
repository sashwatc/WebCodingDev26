/**
 * AuthRouteGuard
 * --------------------------------------------------------------------------
 * Protects routes that require ANY authenticated (and non-suspended) user
 * (regardless of role). Decision order:
 *
 *   1. Loading      — while auth state resolves, show a centered spinner.
 *   2. Unauthenticated — open the sign-in dialog (via effect) and redirect to
 *                        /Home so the user lands on a real page.
 *   3. Suspended    — render a full-screen "Account Suspended" notice.
 *   4. children     — authenticated and in good standing: grant access.
 */

import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function AuthRouteGuard({ children }) {
  // Auth signals: loading flag, authenticated flag, suspended flag, and the
  // helper that pops the global sign-in dialog open.
  const { isLoadingAuth, isAuthenticated, isSuspended, openSignIn } = useAuth();

  // Open the sign-in dialog once when an unauthenticated user hits a guarded
  // route. Doing this in an effect (not during render) avoids re-forcing the
  // dialog open on every render, which would make its close button appear dead.
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      openSignIn();
    }
  }, [isLoadingAuth, isAuthenticated, openSignIn]);

  // ── Outcome 1: Loading ──────────────────────────────────────────────────
  // Auth still resolving: render a full-screen centered spinner.
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          {/* Spinning loader ring */}
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
        </div>
      </div>
    );
  }

  // ── Outcome 2: Not authenticated ────────────────────────────────────────
  // The effect above has already requested the sign-in dialog; redirect to
  // Home so this guarded route unmounts and closing the dialog doesn't
  // immediately re-trigger the guard.
  if (!isAuthenticated) {
    // Send them to a real page so closing the dialog doesn't re-trigger the guard.
    return <Navigate to="/Home" replace />;
  }

  // ── Outcome 3: Suspended ────────────────────────────────────────────────
  // Authenticated but account is suspended: block with a full-screen notice.
  if (isSuspended) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-sm text-center space-y-3">
          {/* Destructive-toned "no entry" icon */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          {/* Suspension headline + guidance to contact staff */}
          <h2 className="text-lg font-semibold text-foreground">Account Suspended</h2>
          <p className="text-sm text-muted-foreground">Your account has been suspended. Contact school staff if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  // ── Outcome 4: Access granted ───────────────────────────────────────────
  // Authenticated and not suspended: render the protected content.
  return children;
}
