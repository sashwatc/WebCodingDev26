import React, { useEffect, useState } from "react";
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
import { Mail, Shield, User } from "lucide-react";

const DEMO_ACCOUNT = DEMO_ACCOUNTS.student;
const ADMIN_DEMO_ACCOUNT = DEMO_ACCOUNTS.admin;

export default function SignInDialog() {
  const { isSignInOpen, setIsSignInOpen, signIn } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(DEMO_ACCOUNT);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSignInOpen) {
      setForm(DEMO_ACCOUNT);
    }
  }, [isSignInOpen]);

  const applyDemoAccount = (account) => {
    setForm({
      full_name: account.full_name,
      email: account.email,
    });
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const user = await signIn(form);
      toast({
        title: "Signed in",
        description: `You're signed in as ${user.full_name}.`,
      });
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isSignInOpen} onOpenChange={setIsSignInOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            This is a browser-only sign-in. Your session is stored on this device.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => applyDemoAccount(DEMO_ACCOUNT)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Student Demo</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{DEMO_ACCOUNT.full_name}</p>
              <p className="text-xs text-slate-500">{DEMO_ACCOUNT.email}</p>
            </button>
            <button
              type="button"
              onClick={() => applyDemoAccount(ADMIN_DEMO_ACCOUNT)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-100"
            >
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Admin Demo</p>
                <Shield className="h-3.5 w-3.5 text-primary" />
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">{ADMIN_DEMO_ACCOUNT.full_name}</p>
              <p className="text-xs text-slate-500">{ADMIN_DEMO_ACCOUNT.email}</p>
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sign-in-name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="sign-in-name"
                value={form.full_name}
                onChange={(event) => updateField("full_name", event.target.value)}
                className="pl-9"
                placeholder="Jordan Kim"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sign-in-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="sign-in-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="pl-9"
                placeholder="you@school.edu"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Use the student demo to review seeded dashboard activity, or the admin demo to access restricted review tools.
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsSignInOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Signing In..." : "Sign In"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
