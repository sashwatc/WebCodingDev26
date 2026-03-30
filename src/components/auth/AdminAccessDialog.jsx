import React, { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Shield } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import { useToast } from "@/components/ui/use-toast";
import { SCHOOL_NAME, SUPPORT_EMAIL } from "@/lib/constants";

export default function AdminAccessDialog() {
  const { t } = useTranslation();
  const { isAdminAccessOpen, setIsAdminAccessOpen, requestAdminAccess, user } = useAuth();
  const { setIsAdminMode } = useMode();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdminAccessOpen) {
      setPassword("");
      setShowPassword(false);
      setError("");
      setSubmitting(false);
    }
  }, [isAdminAccessOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await requestAdminAccess(password);
      setIsAdminMode(true);
      toast({
        title: t("admin_access_dialog.unlocked"),
        description: t("admin_access_dialog.unlocked_description"),
      });
    } catch (nextError) {
      setError(nextError.message || t("admin_access_dialog.unable_to_unlock"));
    } finally {
      setSubmitting(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-white">{user?.full_name || t("admin_access_dialog.signed_in_user")}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              {t("admin_access_dialog.unlocked_hint")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">{t("admin_access_dialog.password_label")}</Label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="pl-9 pr-12"
                placeholder={t("admin_access_dialog.password_placeholder")}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-password-help admin-password-error" : "admin-password-help"}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? t("admin_access_dialog.hide_password") : t("admin_access_dialog.show_password")}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="admin-password-help" className="text-xs text-slate-500 dark:text-slate-400">
              {t("admin_access_dialog.password_help")}
              {" "}
              <a className="font-medium underline underline-offset-2" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </p>
            <p
              id="admin-password-error"
              role="alert"
              aria-live="polite"
              className={`text-sm font-medium text-red-600 ${error ? "block" : "hidden"}`}
            >
              {error}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAdminAccessOpen(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("admin_access_dialog.checking") : t("admin_access_dialog.unlock_admin")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
