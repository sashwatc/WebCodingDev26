/**
 * StaffRouteGuard
 * --------------------------------------------------------------------------
 * Protects staff-facing routes. Admits both staff and admin roles. Decision
 * order:
 *
 *   1. Loading        — show a centered spinner while auth resolves.
 *   2. Unauthenticated — an effect redirects to the login flow; render nothing
 *                        (null) in the meantime to avoid a flash of content.
 *   3. Not staff/admin — render an inline "staff only" notice with a Go-back
 *                        button (history-based, navigate(-1)).
 *   4. children       — staff or admin: grant access.
 *
 * Unlike AuthRouteGuard, the unauthenticated case here navigates to the login
 * flow (navigateToLogin) rather than rendering a redirect to Home.
 */

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function StaffRouteGuard({ children }) {
  // Auth flags plus navigateToLogin (kick off sign-in) from context.
  const { isLoadingAuth, isAuthenticated, isAdmin, isStaff, navigateToLogin } = useAuth();
  // Router navigator used for the "Go back" action on the denial screen.
  const navigate = useNavigate();

  // Once auth has resolved and the visitor is not authenticated, send them to
  // the login flow. Runs in an effect so navigation happens after render.
  useEffect(() => {
    if (!isLoadingAuth && !isAuthenticated) {
      navigateToLogin();
    }
  }, [isLoadingAuth, isAuthenticated, navigateToLogin]);

  // ── Outcome 1: Loading ──────────────────────────────────────────────────
  // Auth still resolving: full-screen centered spinner.
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
  // Redirect is handled by the effect above; render nothing while it happens.
  if (!isAuthenticated) {
    return null;
  }

  // ── Outcome 3: Authenticated but not staff/admin ────────────────────────
  // Show a restricted notice with a button to go back to the previous page.
  if (!isAdmin && !isStaff) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-muted-foreground">Access restricted — staff only</p>
        {/* History back navigation */}
        <button
          className="mt-4 text-sm underline"
          onClick={() => navigate(-1)}
        >
          Go back
        </button>
      </div>
    );
  }

  // ── Outcome 4: Access granted ───────────────────────────────────────────
  // Staff or admin: render the protected content.
  return children;
}
