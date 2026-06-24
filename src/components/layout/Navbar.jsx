/**
 * Lost Then Found - Main Navigation Bar
 * Keeps primary actions and account controls visible without decorative chrome.
 */

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  Home,
  LayoutDashboard,
  Menu,
  MonitorCog,
  Moon,
  PlusCircle,
  Search,
  Shield,
  Sun,
  User,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { appClient } from "@/api/appClient";
import { useQuery } from "@tanstack/react-query";
import { useMode } from "@/lib/ModeContext";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import {
  BRAND_NAME,
  SCHOOL_NAME,
} from "@/lib/constants";
import schoolMark from "@/assets/Spartan_Head.png";

export default function Navbar() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const {
    isAdminMode,
    setIsAdminMode,
    theme,
    setTheme,
  } = useMode();
  const {
    user,
    hasAdminAccess,
    navigateToLogin,
    openAdminAccess,
    revokeAdminAccess,
    logout,
  } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!hasAdminAccess && isAdminMode) {
      setIsAdminMode(false);
    }
  }, [hasAdminAccess, isAdminMode, setIsAdminMode]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["navNotifications", user?.email],
    queryFn: async () => {
      const records = await appClient.recoveryPulse.notifications();
      return records.filter((notification) => !notification.is_read);
    },
    enabled: !!user?.email,
  });

  const isAdmin = hasAdminAccess && isAdminMode;
  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/Home", label: t("common.home"), icon: Home },
    { to: "/Search", label: t("common.search_items"), icon: Search },
    { to: "/LostItems", label: t("common.lost_items", "Lost Items"), icon: AlertTriangle },
    { to: "/ReportLost", label: t("common.report_lost_item"), icon: AlertTriangle },
  ];

  const handleSignIn = async () => {
    try {
      await navigateToLogin();
    } catch (error) {
      toast({
        title: t("navbar.sign_in_unavailable"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: t("navbar.sign_out_failed"),
        description: error.message || t("navbar.please_try_again"),
        variant: "destructive",
      });
    }
  };

  const handleAdminView = async () => {
    if (isAdmin) {
      return;
    }

    if (!user) {
      await handleSignIn();
      return;
    }

    if (hasAdminAccess) {
      setIsAdminMode(true);
      return;
    }

    await openAdminAccess();
  };

  const handleLockAdminAccess = () => {
    setIsAdminMode(false);
    revokeAdminAccess();
    toast({
      title: t("navbar.admin_access_locked"),
      description: t("navbar.admin_access_locked_description"),
    });
  };

  return (
    <header
      role="banner"
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background"
    >
      <nav className="page-shell" aria-label={t("navbar.main_navigation")}>
        <div className="flex min-h-16 items-center justify-between gap-4 py-2">
          <Link to="/Home" className="flex shrink-0 items-center gap-3" aria-label={t("navbar.brand_home", { brand: BRAND_NAME })}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <img src={schoolMark} alt="" className="h-6 w-6 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="whitespace-nowrap text-sm font-semibold leading-none text-foreground">{BRAND_NAME}</p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground">{SCHOOL_NAME}</p>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={isActive(to) ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(to)
                    ? "bg-slate-100 text-foreground dark:bg-slate-800 dark:text-white"
                    : "text-muted-foreground hover:bg-slate-100 hover:text-foreground dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center rounded-lg border border-border bg-muted p-1">
                <button
                  onClick={() => setIsAdminMode(false)}
                  aria-pressed={!isAdmin}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    !isAdmin ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("navbar.student")}
                </button>
                <button
                  onClick={handleAdminView}
                  aria-pressed={isAdmin}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isAdmin ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("navbar.admin")}
                </button>
            </div>

            <Link to="/ReportFound" className="hidden md:block">
              <Button size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                {t("common.report_found_item")}
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="hidden sm:inline-flex">
                  <MonitorCog className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  {t("navbar.appearance")}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light" className="gap-2">
                    <Sun className="w-4 h-4" />
                    {t("navbar.light_mode")}
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark" className="gap-2">
                    <Moon className="w-4 h-4" />
                    {t("navbar.dark_mode")}
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  {t("navbar.language")}
                </DropdownMenuLabel>
                <div className="px-2 py-1.5">
                  <LanguageSwitcher />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {user && hasAdminAccess && (
              <Link to="/AdminDashboard" className="hidden xl:block">
                <Button size="sm" variant="outline" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {t("common.dashboard")}
                </Button>
              </Link>
            )}

            {user && (
              <Link to="/UserDashboard" aria-label={t("navbar.notifications")}>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden gap-2 sm:flex">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                      {user.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="max-w-24 truncate text-sm">{user.full_name?.split(" ")[0]}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    {hasAdminAccess ? t("navbar.admin_access_unlocked") : t("navbar.signed_in")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/UserDashboard" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t("navbar.my_dashboard")}
                    </Link>
                  </DropdownMenuItem>
                  {hasAdminAccess && (
                    <DropdownMenuItem asChild>
                      <Link to="/AdminDashboard" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        {t("navbar.admin_panel")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasAdminAccess && (
                    <DropdownMenuItem onClick={handleLockAdminAccess} className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {t("navbar.lock_admin_access")}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    {t("common.sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {!user && (
              <Button
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex"
                onClick={handleSignIn}
              >
                {t("common.sign_in")}
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="xl:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? t("navbar.close_menu") : t("navbar.open_menu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t bg-background xl:hidden">
          <div className="page-shell space-y-3 py-4">
            <div className="flex items-center rounded-md border border-border bg-muted p-1">
                <button
                  onClick={() => setIsAdminMode(false)}
                  aria-pressed={!isAdmin}
                  className={`flex-1 rounded px-3 py-2 text-xs font-semibold ${
                    !isAdmin ? "bg-background text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t("navbar.student")}
                </button>
                <button
                  onClick={handleAdminView}
                  aria-pressed={isAdmin}
                  className={`flex-1 rounded px-3 py-2 text-xs font-semibold ${
                    isAdmin ? "bg-background text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t("navbar.admin")}
                </button>
            </div>
            <div className="grid gap-2">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  aria-current={isActive(to) ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm font-medium ${
                    isActive(to)
                      ? "border-border bg-muted text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}

              <Link
                to="/ReportFound"
                className="flex items-center gap-3 rounded-md border border-border bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                {t("common.report_found_item")}
              </Link>

              {user && (
                <Link
                  to="/UserDashboard"
                  className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {t("navbar.my_dashboard")}
                </Link>
              )}

              {user && hasAdminAccess && (
                <Link
                  to="/AdminDashboard"
                  className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-sm font-medium text-foreground"
                >
                  <Shield className="h-4 w-4" />
                  {t("navbar.admin_dashboard")}
                </Link>
              )}
            </div>

            <div className="rounded-md border border-border p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("navbar.display_settings")}</p>
              <div className="mt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("navbar.language")}
                </p>
                <LanguageSwitcher />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                    theme === "light" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  {t("navbar.light")}
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${
                    theme === "dark" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  {t("navbar.dark")}
                </button>
              </div>
            </div>

            {user && hasAdminAccess && (
              <button
                type="button"
                onClick={handleLockAdminAccess}
                className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
              >
                <Shield className="h-4 w-4" />
                {t("navbar.lock_admin_access")}
              </button>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
              >
                <User className="h-4 w-4" />
                {t("common.sign_out")}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                className="flex w-full items-center gap-3 rounded-md border border-border px-4 py-3 text-left text-sm font-medium text-foreground"
              >
                <User className="h-4 w-4" />
                {t("common.sign_in")}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
