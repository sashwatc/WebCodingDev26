/**
 * AdminAccessDialog
 * --------------------------------------------------------------------------
 * A modal dialog that explains to a signed-in user why they cannot reach the
 * admin area. It does NOT collect a password or grant access — it is purely an
 * informational "access locked" notice that surfaces the current user's
 * identity and points them to support for help.
 *
 * Open/close state is owned globally by AuthContext (isAdminAccessOpen /
 * setIsAdminAccessOpen) so any part of the app can pop this dialog open. All
 * user-facing copy is localized via react-i18next, with school name and
 * support email injected from app constants.
 */

import React, { useEffect } from "react";
import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { SCHOOL_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export default function AdminAccessDialog() {
  // Translation helper for all localized strings.
  const { t } = useTranslation();
  // Global dialog visibility flag, its setter, and the current user record
  // (used to show who is signed in) all come from AuthContext.
  const { isAdminAccessOpen, setIsAdminAccessOpen, user } = useAuth();

  // Effect placeholder reserved for side effects when the dialog opens.
  // Currently a no-op: it bails out while closed and does nothing when open.
  useEffect(() => {
    if (!isAdminAccessOpen) {
      return;
    }
  }, [isAdminAccessOpen]);

  return (
    // Dialog visibility is driven by the global flag; onOpenChange lets the
    // overlay / Esc / close button toggle the same global state.
    <Dialog open={isAdminAccessOpen} onOpenChange={setIsAdminAccessOpen}>
      <DialogContent className="sm:max-w-md">
        {/* Header: shield icon + localized title and school-scoped description */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("admin_access_dialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("admin_access_dialog.description", { school: SCHOOL_NAME })}
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        <div className="space-y-4 text-sm">
          {/* Red "access locked" callout reusing the admin route guard copy */}
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            <p className="font-semibold">{t("admin_route_guard.access_locked_title")}</p>
            <p className="mt-1 leading-6">
              {t("admin_route_guard.access_locked_description")}
            </p>
          </div>

          {/* Identity card: shows which account is currently signed in
              (falls back to a generic label if no name is available) */}
          <div className="rounded-lg border border-border bg-muted px-4 py-3 text-muted-foreground">
            <p className="font-semibold text-foreground">{user?.full_name || t("admin_access_dialog.signed_in_user")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
          </div>

          {/* Help text with a mailto link to support for requesting access */}
          <p className="text-xs text-muted-foreground">
            {t("admin_access_dialog.password_help")}
            {" "}
            <a className="font-medium underline underline-offset-2" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>

        {/* Footer: single Close button that flips the global flag to false */}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsAdminAccessOpen(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
