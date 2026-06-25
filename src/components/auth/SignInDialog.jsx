import React, { useEffect, useMemo, useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { DEMO_ACCOUNTS } from "@/lib/constants";
import { evaluatePasswordStrength } from "@/lib/passwordStrength";
import { Mail, Shield, User, Lock } from "lucide-react";

const DEMO_ACCOUNT = DEMO_ACCOUNTS.student;
const ADMIN_DEMO_ACCOUNT = DEMO_ACCOUNTS.admin;

const STRENGTH_BAR_CLASSES = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-emerald-600",
];

export default function SignInDialog() {
  const { t } = useTranslation();
  const { isSignInOpen, setIsSignInOpen, signIn, signInWithGoogle, isAppwriteEnabled } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [registerMode, setRegisterMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSignInOpen) {
      setForm(isAppwriteEnabled ? { full_name: "", email: "", password: "" } : { ...DEMO_ACCOUNT, password: "" });
      setRegisterMode(false);
    }
  }, [isSignInOpen, isAppwriteEnabled]);

  const strength = useMemo(() => evaluatePasswordStrength(form.password), [form.password]);

  const applyDemoAccount = (account) => {
    setForm((current) => ({ ...current, full_name: account.full_name, email: account.email }));
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (isAppwriteEnabled && !form.password) {
      toast({
        title: t("sign_in_dialog.sign_in_failed"),
        description: t("sign_in_dialog.password_required"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const user = await signIn({ ...form, register: isAppwriteEnabled && registerMode });
      toast({
        title: t("sign_in_dialog.signed_in"),
        description: t("sign_in_dialog.signed_in_as", { name: user.full_name }),
      });
    } catch (error) {
      toast({
        title: t("sign_in_dialog.sign_in_failed"),
        description: error.message || t("sign_in_dialog.sign_in_failed_description"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: t("sign_in_dialog.sign_in_failed"),
        description: error.message || t("sign_in_dialog.sign_in_failed_description"),
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  const showStrength = isAppwriteEnabled && (registerMode || form.password.length > 0);

  return (
    <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{registerMode ? t("sign_in_dialog.create_account") : t("common.sign_in")}</DialogTitle>
          <DialogDescription>
            {isAppwriteEnabled ? t("sign_in_dialog.appwrite_help") : t("sign_in_dialog.description")}
          </DialogDescription>
        </DialogHeader>

        {isAppwriteEnabled ? (
          <div className="space-y-4">
            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={submitting}>
              {t("sign_in_dialog.continue_with_google")}
            </Button>
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">{t("sign_in_dialog.or_divider")}</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => applyDemoAccount(DEMO_ACCOUNT)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("sign_in_dialog.student_demo")}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{DEMO_ACCOUNT.full_name}</p>
              <p className="text-xs text-slate-500">{DEMO_ACCOUNT.email}</p>
            </button>
            <button
              type="button"
              onClick={() => applyDemoAccount(ADMIN_DEMO_ACCOUNT)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
            >
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("sign_in_dialog.admin_demo")}</p>
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{ADMIN_DEMO_ACCOUNT.full_name}</p>
              <p className="text-xs text-slate-500">{ADMIN_DEMO_ACCOUNT.email}</p>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(!isAppwriteEnabled || registerMode) && (
            <div className="space-y-1.5">
              <Label htmlFor="sign-in-name">{t("sign_in_dialog.full_name")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="sign-in-name"
                  value={form.full_name}
                  onChange={(event) => updateField("full_name", event.target.value)}
                  className="pl-9"
                  placeholder={t("sign_in_dialog.name_placeholder")}
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sign-in-email">{t("sign_in_dialog.email")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="sign-in-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="pl-9"
                placeholder={t("sign_in_dialog.email_placeholder")}
                autoComplete="email"
              />
            </div>
          </div>

          {isAppwriteEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="sign-in-password">{t("sign_in_dialog.password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="sign-in-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  className="pl-9"
                  placeholder={t("sign_in_dialog.password_placeholder")}
                  autoComplete={registerMode ? "new-password" : "current-password"}
                  aria-describedby={showStrength ? "password-strength" : undefined}
                />
              </div>

              {showStrength && (
                <div id="password-strength" className="space-y-1" aria-live="polite">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("password_strength.meter_label")}</span>
                    <span className="font-medium">{t(strength.labelKey)}</span>
                  </div>
                  <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-valuenow={strength.score}
                    aria-valuetext={t(strength.labelKey)}
                  >
                    <div
                      className={`h-full transition-all ${STRENGTH_BAR_CLASSES[strength.score]}`}
                      style={{ width: `${Math.max(strength.percent, form.password ? 12 : 0)}%` }}
                    />
                  </div>
                  {strength.suggestions.length > 0 && (
                    <ul className="text-xs text-muted-foreground">
                      {strength.suggestions.map((suggestion) => (
                        <li key={suggestion}>{t(suggestion)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}

          {!isAppwriteEnabled && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {t("sign_in_dialog.demo_help")}
            </div>
          )}

          {isAppwriteEnabled && (
            <button
              type="button"
              className="text-xs font-medium text-primary underline underline-offset-2"
              onClick={() => setRegisterMode((current) => !current)}
            >
              {registerMode ? t("sign_in_dialog.have_account") : t("sign_in_dialog.need_account")}
            </button>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSignInOpen(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? t("sign_in_dialog.signing_in")
                : registerMode
                  ? t("sign_in_dialog.create_account")
                  : t("common.sign_in")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
