/**
 * AdminRouteGuard
 * --------------------------------------------------------------------------
 * Wraps admin-area routes and decides whether the protected `children` may be
 * rendered. It renders one of four mutually-exclusive outcomes, in priority
 * order:
 *
 *   1. Loading state   — while auth or public settings are still resolving.
 *   2. Sign-in prompt  — when no user is authenticated (offers a sign-in CTA
 *                        and a link back to Home).
 *   3. Access locked   — when a user IS signed in but is neither admin nor
 *                        staff (shows their email; no way forward).
 *   4. children        — when the user is admin OR staff: access granted.
 *
 * Note: this guard admits both admins and staff (`isAdmin || isStaff`).
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Shield, LockKeyhole, UserRoundX } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function AdminRouteGuard({ children }) {
  const { t } = useTranslation();
  // Auth state used to make the access decision:
  // - user: current account (null when signed out)
  // - isAdmin / isStaff: role flags that grant access
  // - isLoadingAuth / isLoadingPublicSettings: gate rendering until ready
  // - navigateToLogin: opens the sign-in flow
  const {
    user,
    isAdmin,
    isStaff,
    isLoadingAuth,
    isLoadingPublicSettings,
    navigateToLogin,
  } = useAuth();
  const { toast } = useToast();
  // Tracks the in-flight sign-in launch so the button can show progress and
  // avoid double submissions.
  const [openingLogin, setOpeningLogin] = useState(false);

  // Launch the sign-in flow; surface any failure as a destructive toast and
  // always clear the loading flag afterwards.
  const handleSignIn = async () => {
    setOpeningLogin(true);
    try {
      await navigateToLogin();
    } catch (error) {
      toast({
        title: t("admin_route_guard.sign_in_unavailable"),
        description: error.message || t("admin_route_guard.sign_in_unavailable_description"),
        variant: "destructive",
      });
    } finally {
      setOpeningLogin(false);
    }
  };

  // ── Outcome 1: Loading ──────────────────────────────────────────────────
  // Auth and/or public settings not yet resolved: show a neutral loading card
  // rather than briefly flashing a sign-in or access-denied screen.
  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin_route_guard.loading_title")}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {t("admin_route_guard.loading_description")}
          </p>
        </div>
      </div>
    );
  }

  // ── Outcome 2: Not signed in ────────────────────────────────────────────
  // No authenticated user: prompt them to sign in, with a sign-in CTA and a
  // fallback link back to Home.
  if (!user) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          {/* Lock icon + sign-in-required heading and description */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <LockKeyhole className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin_route_guard.sign_in_required_title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("admin_route_guard.sign_in_required_description")}
          </p>
          {/* Actions: launch sign-in (shows progress label while opening) or
              return to the public Home page */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={handleSignIn} disabled={openingLogin}>
              {openingLogin ? t("admin_route_guard.opening_sign_in") : t("common.sign_in")}
            </Button>
            <Link to="/Home">
              <Button variant="outline">{t("admin_route_guard.back_home")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Outcome 3: Signed in but unauthorized ───────────────────────────────
  // A real user that is neither admin nor staff: show a hard "access locked"
  // notice (including their email) with no path forward.
  if (!isAdmin && !isStaff) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          {/* Red "user blocked" icon + access-locked heading/description */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <UserRoundX className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin_route_guard.access_locked_title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("admin_route_guard.access_locked_description")}
          </p>
          {/* Echo the signed-in email so the user can confirm which account
              is being denied */}
          <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
      </div>
    );
  }

  // ── Outcome 4: Access granted ───────────────────────────────────────────
  // User is admin or staff: render the protected route content.
  return children;
}
