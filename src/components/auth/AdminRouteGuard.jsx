import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Shield, LockKeyhole, UserRoundX } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function AdminRouteGuard({ children }) {
  const { t } = useTranslation();
  const {
    user,
    isAdmin,
    isStaff,
    isLoadingAuth,
    isLoadingPublicSettings,
    navigateToLogin,
  } = useAuth();
  const { toast } = useToast();
  const [openingLogin, setOpeningLogin] = useState(false);

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

  if (!user) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <LockKeyhole className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin_route_guard.sign_in_required_title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("admin_route_guard.sign_in_required_description")}
          </p>
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

  if (!isAdmin && !isStaff) {
    return (
      <div className="page-shell max-w-2xl py-20">
        <div className="surface-card px-8 py-14 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <UserRoundX className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t("admin_route_guard.access_locked_title")}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("admin_route_guard.access_locked_description")}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground">
            {user?.email}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
