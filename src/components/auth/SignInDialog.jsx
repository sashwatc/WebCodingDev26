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
import { appClient } from "@/api/appClient";
import { Briefcase, ChevronLeft, Mail, Shield, User, User2, Lock } from "lucide-react";

const DEMO_ACCOUNT = DEMO_ACCOUNTS.student;
const ADMIN_DEMO_ACCOUNT = DEMO_ACCOUNTS.admin;
const STAFF_DEMO_ACCOUNT = DEMO_ACCOUNTS.staff;

const STRENGTH_BAR_CLASSES = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-emerald-600",
];

export default function SignInDialog() {
  const { t } = useTranslation();
  const { isSignInOpen, setIsSignInOpen, signInMode, signIn, signInWithGoogle, isAppwriteEnabled } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [registerMode, setRegisterMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [registerRole, setRegisterRole] = useState("student");

  useEffect(() => {
    if (isSignInOpen) {
      setForm(isAppwriteEnabled ? { full_name: "", email: "", password: "" } : { ...DEMO_ACCOUNT, password: "" });
      setRegisterMode(signInMode === "register");
      setForgotMode(false);
      setForgotEmail("");
    }
  }, [isSignInOpen, isAppwriteEnabled, signInMode]);

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
      const user = await signIn({
        ...form,
        register: registerMode,
        ...(registerMode ? { role: registerRole } : {}),
      });
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

  const handleForgotPassword = async () => {
    try {
      await appClient.auth.forgotPassword(forgotEmail);
      toast({ title: "Reset link sent", description: `If an account exists for ${forgotEmail}, a reset link is on its way.` });
      setForgotMode(false);
      setRegisterMode(false);
    } catch (error) {
      toast({
        title: t("sign_in_dialog.sign_in_failed", "Something went wrong"),
        description: error.message || "Could not send a reset link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const showStrength = isAppwriteEnabled && (registerMode || form.password.length > 0);

  return (
    <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
      <DialogContent className="sm:max-w-md">
        {forgotMode ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => { setForgotMode(false); setRegisterMode(false); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back to sign in
            </button>
            <div>
              <DialogTitle>Reset your password</DialogTitle>
              <DialogDescription className="mt-1">We'll send a reset link to your email.</DialogDescription>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <Button className="w-full" onClick={handleForgotPassword} disabled={!forgotEmail.trim()}>
              Send reset link
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{registerMode ? t("sign_in_dialog.create_account") : t("common.sign_in")}</DialogTitle>
              <DialogDescription>
                {registerMode
                  ? "Create a PVHS account to file reports, track claims, and recover items."
                  : isAppwriteEnabled ? t("sign_in_dialog.appwrite_help") : t("sign_in_dialog.description")}
              </DialogDescription>
            </DialogHeader>

            {isAppwriteEnabled && !registerMode && (
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
            )}

            {!isAppwriteEnabled && !registerMode && (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => applyDemoAccount(DEMO_ACCOUNT)}
                  className="rounded-xl border border-border bg-muted px-4 py-3 text-left transition hover:border-primary/40 hover:bg-accent"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("sign_in_dialog.student_demo")}</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{DEMO_ACCOUNT.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{DEMO_ACCOUNT.email}</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyDemoAccount(STAFF_DEMO_ACCOUNT)}
                  className="rounded-xl border border-border bg-muted px-4 py-3 text-left transition hover:border-primary/40 hover:bg-accent"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Staff Demo</p>
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{STAFF_DEMO_ACCOUNT.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{STAFF_DEMO_ACCOUNT.email}</p>
                </button>
                <button
                  type="button"
                  onClick={() => applyDemoAccount(ADMIN_DEMO_ACCOUNT)}
                  className="rounded-xl border border-border bg-muted px-4 py-3 text-left transition hover:border-primary/40 hover:bg-accent"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("sign_in_dialog.admin_demo")}</p>
                    <Shield className="h-3 w-3 text-primary" />
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{ADMIN_DEMO_ACCOUNT.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{ADMIN_DEMO_ACCOUNT.email}</p>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {(!isAppwriteEnabled || registerMode) && (
                <div className="space-y-1.5">
                  <Label htmlFor="sign-in-name">{t("sign_in_dialog.full_name")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

              {registerMode && (
                <div className="space-y-2">
                  <Label>I am a...</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "student", icon: User2, label: "Student" },
                      { value: "staff", icon: Briefcase, label: "Staff" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRegisterRole(opt.value)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                          registerRole === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <opt.icon className="h-4 w-4" />{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="sign-in-email">{t("sign_in_dialog.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

                  {!registerMode && (
                    <button
                      type="button"
                      onClick={() => { setForgotMode(true); setRegisterMode(false); }}
                      className="text-xs text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              {!isAppwriteEnabled && !registerMode && (
                <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {t("sign_in_dialog.demo_help")}
                </div>
              )}

              <button
                type="button"
                className="text-xs font-medium text-primary underline underline-offset-2"
                onClick={() => setRegisterMode((current) => !current)}
              >
                {registerMode ? t("sign_in_dialog.have_account") : t("sign_in_dialog.need_account")}
              </button>

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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
