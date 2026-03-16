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
import { Mail, User } from "lucide-react";

const DEMO_ACCOUNT = {
  full_name: "Jordan Kim",
  email: "jordan.kim@pleasantvalley.edu",
};

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
            Use the demo account values above if you want to see the seeded dashboard data immediately.
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
