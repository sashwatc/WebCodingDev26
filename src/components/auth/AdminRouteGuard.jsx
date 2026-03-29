import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, LockKeyhole, UserRoundX } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useMode } from "@/lib/ModeContext";
import { useToast } from "@/components/ui/use-toast";

export default function AdminRouteGuard({ children }) {
  const {
    user,
    hasAdminAccess,
    isLoadingAuth,
    isLoadingPublicSettings,
    navigateToLogin,
    openAdminAccess,
  } = useAuth();
  const { isAdminMode, setIsAdminMode } = useMode();
  const { toast } = useToast();
  const [openingLogin, setOpeningLogin] = useState(false);
  const [openingUnlock, setOpeningUnlock] = useState(false);

  useEffect(() => {
    const nextAdminMode = Boolean(hasAdminAccess);

    if (isAdminMode !== nextAdminMode) {
      setIsAdminMode(nextAdminMode);
    }
  }, [hasAdminAccess, isAdminMode, setIsAdminMode]);

  const handleSignIn = async () => {
    setOpeningLogin(true);
    try {
      await navigateToLogin();
    } catch (error) {
      toast({
        title: "Sign in unavailable",
        description: error.message || "Unable to open the sign-in dialog.",
        variant: "destructive",
      });
    } finally {
      setOpeningLogin(false);
    }
  };

  const handleUnlock = async () => {
    setOpeningUnlock(true);
    try {
      await openAdminAccess();
    } catch (error) {
      toast({
        title: "Unlock unavailable",
        description: error.message || "Unable to open the admin access dialog.",
        variant: "destructive",
      });
    } finally {
      setOpeningUnlock(false);
    }
  };

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Loading admin workspace</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Checking the current session before showing restricted moderation tools.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <LockKeyhole className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Admin sign-in required</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            This dashboard is restricted in the judging build. Sign in before unlocking the moderation workspace.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={handleSignIn} disabled={openingLogin}>
              {openingLogin ? "Opening Sign-In..." : "Sign In"}
            </Button>
            <Link to="/Home">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <UserRoundX className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-950">Admin access locked</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Sign in is complete, but moderation tools are still protected. Enter the admin password to unlock the
            review workspace for this browser session.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={handleUnlock} disabled={openingUnlock}>
              {openingUnlock ? "Opening Unlock..." : "Unlock Admin"}
            </Button>
            <Link to="/Home">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
