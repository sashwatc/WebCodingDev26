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
  const { t } = useTranslation();
  const { isAdminAccessOpen, setIsAdminAccessOpen, user } = useAuth();

  useEffect(() => {
    if (!isAdminAccessOpen) {
      return;
    }
  }, [isAdminAccessOpen]);

  return (
    <Dialog open={isAdminAccessOpen} onOpenChange={setIsAdminAccessOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {t("admin_access_dialog.title")}
          </DialogTitle>
          <DialogDescription>
            {t("admin_access_dialog.description", { school: SCHOOL_NAME })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            <p className="font-semibold">{t("admin_route_guard.access_locked_title")}</p>
            <p className="mt-1 leading-6">
              {t("admin_route_guard.access_locked_description")}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">{user?.full_name || t("admin_access_dialog.signed_in_user")}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("admin_access_dialog.password_help")}
            {" "}
            <a className="font-medium underline underline-offset-2" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsAdminAccessOpen(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
